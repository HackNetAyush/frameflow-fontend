/**
 * Frontend video encoding via WebCodecs.
 *
 * The previous pipeline captured with CCapture, which buffers every frame as a
 * WebP data URL before handing the lot to ffmpeg.wasm. That costs roughly 80KB
 * per frame, which is why the capture rate had to be pinned at 2fps — 24fps for
 * a nine-minute lesson would have needed about a gigabyte of strings.
 *
 * `VideoEncoder` hands back compressed chunks as it goes, so memory stays flat
 * and the muxer can stream them straight into an MP4. That buys 30fps, hardware
 * acceleration, and H.264 output that actually plays on iOS — none of which the
 * WebM path could offer. `encodeFallback` keeps the old route alive for
 * browsers without WebCodecs.
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/** Tried in order; the first the browser accepts wins. */
const AVC_CODECS = ['avc1.640033', 'avc1.640028', 'avc1.4D4028', 'avc1.42E01E'];

const videoBitrate = (w, h, fps) =>
  Math.min(24_000_000, Math.max(2_000_000, Math.round(w * h * fps * 0.11)));

/**
 * Does this browser support the full hardware path?
 * Returns the usable codec string, or `null`.
 */
export async function pickVideoCodec(width, height, fps) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;

  for (const codec of AVC_CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: videoBitrate(width, height, fps),
        framerate: fps,
      });
      if (supported) return codec;
    } catch {
      /* try the next profile */
    }
  }
  return null;
}

export const supportsWebCodecs = async (width, height, fps) =>
  Boolean(await pickVideoCodec(width, height, fps));

/* ------------------------------------------------------------------ *
 * Audio
 * ------------------------------------------------------------------ */

/** Decode a wav blob into an AudioBuffer without needing playback. */
export async function decodeAudio(blob) {
  const bytes = await blob.arrayBuffer();
  const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  // A 1-frame context is enough to borrow the decoder.
  const probe = new Ctx(1, 1, 48000);
  return probe.decodeAudioData(bytes);
}

/**
 * Encode an AudioBuffer to AAC, feeding chunks to the muxer.
 * Resolves to `false` if AAC is unavailable, so the caller can mux video-only.
 */
async function encodeAudioTrack(muxer, buffer, signal) {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return false;

  const { numberOfChannels, sampleRate, length } = buffer;
  const config = { codec: 'mp4a.40.2', sampleRate, numberOfChannels, bitrate: 160_000 };

  try {
    const { supported } = await AudioEncoder.isConfigSupported(config);
    if (!supported) return false;
  } catch {
    return false;
  }

  let failed = false;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: () => { failed = true; },
  });
  encoder.configure(config);

  const channels = Array.from({ length: numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const CHUNK = 8192;

  for (let offset = 0; offset < length; offset += CHUNK) {
    if (signal?.aborted) break;
    if (failed) break;

    const frames = Math.min(CHUNK, length - offset);
    // 'f32-planar' expects channel planes laid end to end.
    const planar = new Float32Array(frames * numberOfChannels);
    for (let c = 0; c < numberOfChannels; c++) {
      planar.set(channels[c].subarray(offset, offset + frames), c * frames);
    }

    const data = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: frames,
      numberOfChannels,
      timestamp: Math.round((offset / sampleRate) * 1e6),
      data: planar,
    });

    encoder.encode(data);
    data.close();

    if (encoder.encodeQueueSize > 16) {
      await new Promise((r) => { encoder.ondequeue = r; });
    }
  }

  await encoder.flush();
  encoder.close();
  return !failed;
}

/* ------------------------------------------------------------------ *
 * Main encode
 * ------------------------------------------------------------------ */

/**
 * Render and encode an MP4 entirely in the browser.
 *
 * @param {object} opts
 * @param {HTMLCanvasElement|OffscreenCanvas} opts.canvas   frame source
 * @param {number}   opts.fps
 * @param {number}   opts.durationMs
 * @param {Function} opts.drawFrame  `(timeMs, frameIndex) => void`
 * @param {Blob}     [opts.audioBlob]
 * @param {Function} [opts.onProgress] `(0..1)`
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<Blob>} an `video/mp4` blob
 */
export async function encodeMp4({
  canvas, fps, durationMs, drawFrame, audioBlob, onProgress, signal,
}) {
  const width = canvas.width;
  const height = canvas.height;

  const codec = await pickVideoCodec(width, height, fps);
  if (!codec) throw new Error('WebCodecs H.264 encoding is not available');

  let audioBuffer = null;
  if (audioBlob) {
    try {
      audioBuffer = await decodeAudio(audioBlob);
    } catch {
      audioBuffer = null;
    }
  }

  // Check AAC up front. Discovering it is unsupported *after* encoding every
  // video frame would mean re-rendering the whole lesson on the fallback path.
  if (audioBuffer && typeof AudioEncoder !== 'undefined') {
    try {
      const { supported } = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        bitrate: 160_000,
      });
      if (!supported) throw new Error('unsupported');
    } catch {
      throw new Error('AAC audio encoding is not available');
    }
  } else if (audioBuffer) {
    throw new Error('AudioEncoder is not available');
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    fastStart: 'in-memory',
    video: { codec: 'avc', width, height },
    ...(audioBuffer
      ? {
        audio: {
          codec: 'aac',
          numberOfChannels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate,
        },
      }
      : {}),
  });

  let encodeError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e; },
  });

  encoder.configure({
    codec,
    width,
    height,
    bitrate: videoBitrate(width, height, fps),
    framerate: fps,
    latencyMode: 'quality',
  });

  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
  const frameDurationUs = Math.round(1e6 / fps);
  const keyEvery = fps * 2;

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) break;
    if (encodeError) throw encodeError;

    drawFrame((i * 1000) / fps, i);

    const frame = new VideoFrame(canvas, {
      timestamp: i * frameDurationUs,
      duration: frameDurationUs,
    });
    encoder.encode(frame, { keyFrame: i % keyEvery === 0 });
    frame.close();

    // Keep the encoder fed but never let its queue run away with memory.
    if (encoder.encodeQueueSize > 8) {
      await new Promise((resolve) => { encoder.ondequeue = resolve; });
    } else if (i % 12 === 0) {
      // Yield so the tab stays responsive during long renders.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    onProgress?.((i + 1) / totalFrames);
  }

  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;

  if (audioBuffer) {
    const ok = await encodeAudioTrack(muxer, audioBuffer, signal);
    if (!ok) {
      // AAC refused mid-flight. Better a silent video than a corrupt file, but
      // the caller should know so it can fall back and keep the narration.
      throw new Error('AAC audio encoding failed');
    }
  }

  muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}

/* ------------------------------------------------------------------ *
 * Fallback: CCapture + ffmpeg.wasm
 * ------------------------------------------------------------------ */

/**
 * Legacy route for browsers without WebCodecs.
 *
 * Frame rate is deliberately low here: CCapture holds every frame in memory, so
 * this trades smoothness for not crashing the tab.
 */
export async function encodeFallback({
  canvas, fps, durationMs, drawFrame, audioBlob, onProgress, signal, ffmpeg,
}) {
  const { default: CCapture } = await import('ccapture.js-npmfixed');
  const { fetchFile } = await import('@ffmpeg/ffmpeg');

  const capturer = new CCapture({ format: 'webm', framerate: fps, quality: 88, verbose: false });
  capturer.start();

  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));

  for (let i = 0; i < totalFrames; i++) {
    if (signal?.aborted) break;
    drawFrame((i * 1000) / fps, i);
    capturer.capture(canvas);
    onProgress?.((i + 1) / totalFrames);
    if (i % 8 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  capturer.stop();
  const videoBlob = await new Promise((resolve) => capturer.save(resolve));

  if (!ffmpeg || !audioBlob) return videoBlob;

  ffmpeg.FS('writeFile', 'v.webm', await fetchFile(videoBlob));
  ffmpeg.FS('writeFile', 'a.wav', await fetchFile(audioBlob));
  await ffmpeg.run('-i', 'v.webm', '-i', 'a.wav', '-c:v', 'copy', '-c:a', 'libopus', '-shortest', 't.webm');
  // Second pass rewrites the duration header CCapture leaves wrong.
  await ffmpeg.run('-i', 't.webm', '-c', 'copy', 'out.webm');

  const data = ffmpeg.FS('readFile', 'out.webm');
  return new Blob([data.buffer], { type: 'video/webm' });
}
