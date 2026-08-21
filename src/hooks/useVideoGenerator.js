import { useCallback, useEffect, useRef, useState } from 'react';
import {
  composeSlide, paintBackground, paintChrome, paintPage, ensureFonts, getTheme,
} from '../render';
import { encodeMp4, encodeFallback, supportsWebCodecs } from '../video/encoder';

const server_url = import.meta.env.VITE_SERVER_URL;

/** Output frame size. 1080p gives the layout engine room to breathe. */
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const FALLBACK_FPS = 6;

const SLIDE_THEME = 'studio';

/** How long a slide's content takes to write itself on, and to clear. */
const REVEAL_PER_BLOCK = 240;
const REVEAL_MIN = 650;
const REVEAL_MAX = 2600;
const OUTRO_MS = 260;

/**
 * Progress is one monotonic 0-100 scale with fixed weights, so the bar never
 * fills and restarts the way it used to when the backend phase finished.
 */
const PHASE = {
  script: [0, 12],
  media: [12, 55],
  assets: [55, 63],
  compose: [63, 70],
  encode: [70, 98],
};

const lerp = (phase, t) => {
  const [a, b] = phase;
  return a + (b - a) * Math.max(0, Math.min(1, t));
};

export const useVideoGenerator = () => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [video, setVideo] = useState(null);
  const [isEngineLoaded, setIsEngineLoaded] = useState(false);

  const canvasRef = useRef(null);
  const ffmpegRef = useRef(null);
  const abortRef = useRef(null);
  const useWebCodecsRef = useRef(false);

  /* --- smoothed progress ------------------------------------------- */
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const diff = targetRef.current - currentRef.current;
      if (Math.abs(diff) > 0.05) {
        currentRef.current += Math.sign(diff) * Math.max(Math.abs(diff) * 0.08, 0.08);
        setProgress(Math.min(100, currentRef.current));
      } else if (currentRef.current !== targetRef.current) {
        currentRef.current = targetRef.current;
        setProgress(currentRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setTarget = useCallback((v) => {
    // Never let progress move backwards; that reads as a failure to users.
    targetRef.current = Math.max(targetRef.current, Math.min(100, v));
  }, []);

  /* --- engine readiness --------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Fonts must be resolvable before the first measurement or every layout
      // is computed against fallback metrics and the fit is wrong.
      await ensureFonts();
      const ok = await supportsWebCodecs(WIDTH, HEIGHT, FPS);
      if (cancelled) return;

      useWebCodecsRef.current = ok;
      // ffmpeg.wasm is only needed on the fallback path, so the splash screen
      // no longer waits ~10s for a 25MB core the fast path never touches.
      if (!ok) await loadFfmpeg();
      if (!cancelled) setIsEngineLoaded(true);
    })();

    return () => { cancelled = true; };
  }, []);

  const loadFfmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    try {
      const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = createFFmpeg({
        log: false,
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    } catch (err) {
      console.error('ffmpeg load failed', err);
      return null;
    }
  };

  /* --- assets -------------------------------------------------------- */

  const preloadImages = async (slides) => {
    const urls = [...new Set(
      slides.flatMap((s) => [...String(s.content).matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1])),
    )];

    const cache = {};
    await Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { cache[url] = img; resolve(); };
      img.onerror = () => resolve(); // one bad image must not sink the video
      img.src = url;
    })));

    // A cross-origin image that loaded but failed its CORS check still taints
    // the canvas, and the first encode call then throws SecurityError after all
    // the backend work is already paid for. Probe each one and drop the unsafe.
    const probe = document.createElement('canvas');
    probe.width = 2;
    probe.height = 2;
    const pctx = probe.getContext('2d', { willReadFrequently: true });

    for (const [url, img] of Object.entries(cache)) {
      try {
        pctx.clearRect(0, 0, 2, 2);
        pctx.drawImage(img, 0, 0, 2, 2);
        pctx.getImageData(0, 0, 1, 1);
      } catch {
        console.warn(`Dropping image that would taint the canvas: ${url}`);
        delete cache[url];
      }
    }

    return cache;
  };

  /* --- timeline ------------------------------------------------------ */

  /**
   * Compose every slide, then flatten to a page timeline.
   *
   * A slide whose content had to be split across pages divides its own
   * narration window between them by content weight, so audio and visuals stay
   * locked together no matter how the fitter paginated.
   */
  const buildTimeline = (slides, imageCache, onProgress) => {
    const segments = [];
    let clock = 0;

    slides.forEach((slide, i) => {
      const duration = Number(slide.time);
      // A zero duration used to make a slide unreachable by the frame lookup
      // while its audio still played, desyncing everything after it.
      const safe = Number.isFinite(duration) && duration > 0 ? duration : 2200;

      const { pages } = composeSlide(slide.content, {
        width: WIDTH, height: HEIGHT, theme: SLIDE_THEME, imageCache,
      });

      const totalWeight = pages.reduce((s, p) => s + p.weight, 0) || 1;
      pages.forEach((page, p) => {
        const span = (safe * page.weight) / totalWeight;
        const blocks = Math.max(1, page.bounds.length);
        segments.push({
          page,
          start: clock,
          end: clock + span,
          slideIndex: i,
          pageIndex: p,
          revealMs: Math.min(
            Math.max(blocks * REVEAL_PER_BLOCK, REVEAL_MIN),
            Math.min(REVEAL_MAX, span * 0.55),
          ),
        });
        clock += span;
      });

      onProgress?.((i + 1) / slides.length);
    });

    return { segments, duration: clock };
  };

  /**
   * Lazily bake pages at full reveal, keeping only a small window in memory.
   *
   * Once a page has finished revealing it is a static image for the rest of its
   * span, so those frames collapse to one `drawImage` instead of replaying
   * hundreds of paint ops — only the reveal window is painted op by op. Baking
   * every page up front would be simpler, but at 1080p each canvas is ~8MB, so
   * a long lesson would hold hundreds of megabytes for no reason: frames are
   * produced in time order and never revisit an earlier page.
   */
  const createBaker = (segments, theme) => {
    const cache = new Map();
    const KEEP = 2;

    return (i) => {
      const hit = cache.get(i);
      if (hit) return hit;

      const c = document.createElement('canvas');
      c.width = WIDTH;
      c.height = HEIGHT;
      const ctx = c.getContext('2d');
      paintBackground(ctx, { width: WIDTH, height: HEIGHT, theme });
      paintPage(ctx, segments[i].page, { t: 1, stagger: false });

      cache.set(i, c);
      for (const key of cache.keys()) {
        if (key < i - KEEP) {
          const stale = cache.get(key);
          stale.width = 0;
          stale.height = 0;
          cache.delete(key);
        }
      }
      return c;
    };
  };

  /* --- main ----------------------------------------------------------- */

  const processRequest = useCallback(async (prompt) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('generating_script');
    setError(null);
    setVideo(null);
    targetRef.current = 0;
    currentRef.current = 0;
    setProgress(0);

    const chatID = `chat_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    const theme = getTheme(SLIDE_THEME);

    try {
      /* 1. script + media, streamed */
      const response = await fetch(`${server_url}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, chatID }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      if (!response.body) throw new Error('Streaming is not supported in this browser.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          let event;
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === 'error') throw new Error(event.message);
          if (event.type !== 'progress') continue;

          const msg = String(event.message || '');
          if (/image/i.test(msg)) setStatus('generating_images');
          else if (/audio|step/i.test(msg)) setStatus('generating_audio');
          else setStatus('generating_script');

          // `!= null` matters: a legitimate `progress: 0` is falsy and the old
          // check dropped it.
          if (event.progress != null) {
            const pct = Number(event.progress) / 100;
            setTarget(pct < 0.2 ? lerp(PHASE.script, pct / 0.2) : lerp(PHASE.media, (pct - 0.2) / 0.8));
          }
        }
      }

      /* 2. assets */
      setStatus('loading_images');
      setTarget(PHASE.assets[0]);

      const slides = await (await fetch(`${server_url}/${chatID}/json/j1.json`, { signal: controller.signal })).json();
      if (!Array.isArray(slides) || !slides.length) throw new Error('The lesson came back empty. Try rephrasing your topic.');

      const imageCache = await preloadImages(slides);
      setTarget(PHASE.assets[0] + 4);

      const audioBlob = await (await fetch(`${server_url}/${chatID}/merged/output.wav`, { signal: controller.signal })).blob();
      setTarget(PHASE.assets[1]);

      /* 3. layout */
      setStatus('rendering');
      await ensureFonts();
      const { segments, duration } = buildTimeline(slides, imageCache, (t) => setTarget(lerp(PHASE.compose, t)));
      if (!segments.length) throw new Error('Nothing to render.');

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Render surface is not ready.');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d', { alpha: false });

      const baked = createBaker(segments, theme);
      const totalSlides = slides.length;

      let cursor = 0;
      const drawFrame = (timeMs) => {
        while (cursor < segments.length - 1 && timeMs >= segments[cursor].end) cursor++;
        while (cursor > 0 && timeMs < segments[cursor].start) cursor--;

        const seg = segments[cursor];
        const local = timeMs - seg.start;
        const remaining = seg.end - timeMs;

        if (local < seg.revealMs) {
          paintBackground(ctx, { width: WIDTH, height: HEIGHT, theme });
          paintPage(ctx, seg.page, { t: local / seg.revealMs });
        } else if (remaining < OUTRO_MS && cursor < segments.length - 1) {
          // Ease the outgoing page down so the cut to the next one isn't abrupt.
          paintBackground(ctx, { width: WIDTH, height: HEIGHT, theme });
          ctx.save();
          ctx.globalAlpha = Math.max(0, remaining / OUTRO_MS);
          ctx.drawImage(baked(cursor), 0, 0);
          ctx.restore();
        } else {
          ctx.drawImage(baked(cursor), 0, 0);
        }

        paintChrome(ctx, {
          width: WIDTH, height: HEIGHT, theme,
          index: seg.slideIndex, total: totalSlides,
          progress: timeMs / duration,
        });
      };

      /* 4. encode */
      setStatus('merging');
      const onEncode = (t) => setTarget(lerp(PHASE.encode, t));

      let blob;
      if (useWebCodecsRef.current) {
        try {
          blob = await encodeMp4({
            canvas, fps: FPS, durationMs: duration, drawFrame, audioBlob,
            onProgress: onEncode, signal: controller.signal,
          });
        } catch (err) {
          console.warn('WebCodecs encode failed, falling back:', err);
          blob = null;
        }
      }

      if (!blob) {
        const ffmpeg = await loadFfmpeg();
        blob = await encodeFallback({
          canvas, fps: FALLBACK_FPS, durationMs: duration, drawFrame, audioBlob,
          onProgress: onEncode, signal: controller.signal, ffmpeg,
        });
      }

      if (controller.signal.aborted) return;

      const mimeType = blob.type || 'video/mp4';
      setVideo({
        url: URL.createObjectURL(blob),
        mimeType,
        ext: mimeType.includes('mp4') ? 'mp4' : 'webm',
        durationMs: duration,
      });

      setTarget(100);
      setTimeout(() => setStatus('done'), 400);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Something went wrong while generating your video.');
      setStatus('error');
    }
  }, [setTarget]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    processRequest,
    cancel,
    status,
    progress,
    error,
    video,
    videoUrl: video?.url ?? null,
    canvasRef,
    isEngineLoaded,
  };
};
