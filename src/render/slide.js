/**
 * Slide composition: fit, paginate, place images, draw chrome.
 *
 * This is the piece that makes overflow structurally impossible. Layout is
 * pure measurement, so a slide can be laid out repeatedly at descending sizes
 * until one fits; if nothing fits even at the floor size, the content is split
 * across pages instead of being drawn off the bottom of the frame.
 */

import { getTheme, frameMetrics, FONTS } from './theme.js';
import { fontString, ensureFonts } from './fonts.js';
import { parseSlide } from './md.js';
import { layoutBlocks } from './layout.js';
import { paintOps } from './paint.js';

/**
 * Root sizes to try, as a fraction of frame height. 1080p maps to roughly
 * 40px down to 22px — the floor is where text stops being readable at
 * typical viewing distance, not where it stops fitting.
 */
const ROOT_STEPS = [0.038, 0.0355, 0.033, 0.0305, 0.0285, 0.0265, 0.0245, 0.0225, 0.0205];

/** Pull content up slightly from true centre — optically centred reads better. */
const VERTICAL_BIAS = 0.38;

const MIN_IMAGE_FRACTION = 0.2;

/* ------------------------------------------------------------------ *
 * Image placement
 * ------------------------------------------------------------------ */

/**
 * Candidate arrangements for a slide that carries an image.
 *
 * The old renderer always reserved exactly 40% of the width for the image and
 * 60% for text, regardless of the image's aspect ratio or how much text there
 * was — a tall diagram got letterboxed into a wide box while a wide one wasted
 * the column. These candidates are scored against real measurements instead.
 */
function imageCandidates(hasImage, aspect, frame, root) {
  const { contentW, contentH } = frame;
  if (!hasImage) return [{ mode: 'text', textW: contentW, textH: contentH }];

  const gutter = root * 1.5;
  const out = [];

  // Side-by-side: better for portrait and square art.
  for (const f of [0.5, 0.56, 0.62, 0.68]) {
    const usable = contentW - gutter;
    out.push({
      mode: 'split',
      textW: Math.round(usable * f),
      textH: contentH,
      imageW: Math.round(usable * (1 - f)),
      imageH: contentH,
      imageX: frame.contentX + Math.round(usable * f) + gutter,
      imageY: frame.contentY,
    });
  }

  // Stacked: better for wide art, or text short enough to leave a real band.
  for (const f of [0.34, 0.44, 0.54]) {
    const imageH = Math.round(contentH * f);
    out.push({
      mode: 'stack',
      textW: contentW,
      textH: contentH - imageH - gutter,
      imageW: contentW,
      imageH,
      imageX: frame.contentX,
      imageY: frame.contentY + (contentH - imageH),
      stacked: true,
    });
  }

  // Wide images read best full-bleed under the text.
  if (aspect > 1.7) {
    out.sort((a, b) => (b.mode === 'stack' ? 1 : 0) - (a.mode === 'stack' ? 1 : 0));
  }

  return out;
}

/** Contain-fit an image inside a box. */
function fitImage(img, box, radius, theme) {
  const scale = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const w = Math.max(1, img.naturalWidth * scale);
  const h = Math.max(1, img.naturalHeight * scale);
  return {
    k: 'image',
    img,
    x: Math.round(box.x + (box.w - w) / 2),
    y: Math.round(box.y + (box.h - h) / 2),
    w: Math.round(w),
    h: Math.round(h),
    r: radius,
    stroke: theme.imageFrame,
    lw: 1,
  };
}

/* ------------------------------------------------------------------ *
 * Fitting
 * ------------------------------------------------------------------ */

function tryFit(blocks, image, frame, theme, root) {
  const aspect = image ? image.naturalWidth / Math.max(1, image.naturalHeight) : 1;
  let best = null;

  for (const cand of imageCandidates(Boolean(image), aspect, frame, root)) {
    if (cand.textH <= root * 3) continue;

    const env = {
      x: frame.contentX,
      y: frame.contentY,
      width: cand.textW,
      root,
      theme,
      depth: 0,
    };

    const laid = layoutBlocks(blocks, env, frame.contentY);
    if (laid.height > cand.textH) continue;

    const frameArea = frame.contentW * frame.contentH;
    let score;

    if (image) {
      const scale = Math.min(cand.imageW / image.naturalWidth, cand.imageH / image.naturalHeight);
      const shown = image.naturalWidth * scale * image.naturalHeight * scale;
      const imageArea = shown / frameArea;
      if (imageArea < MIN_IMAGE_FRACTION * 0.35) continue;

      // Score how much of the *frame* the arrangement actually uses, not how
      // full the text column is on its own. Rewarding column fill alone pushes
      // square diagrams into a thin strip under the text, when the same image
      // could occupy 40% of the slide in a side column.
      const used = (laid.height * cand.textW + shown) / frameArea;
      score = used * 0.72 + Math.min(1, imageArea / 0.3) * 0.28;
    } else {
      score = Math.min(1, laid.height / cand.textH);
    }

    if (!best || score > best.score) {
      best = { score, cand, laid, root };
    }
  }

  return best;
}

/**
 * Break a single block that is taller than a whole page into smaller blocks of
 * the same kind.
 *
 * Page breaking alone only cuts *between* blocks, so one 40-item list or a
 * 60-line code sample would still produce a page that overflows. Splitting
 * within the block is what guarantees the pagination loop can always converge.
 */
function splitOversized(block, measure, availH, depth = 0) {
  if (depth > 6 || measure([block]) <= availH) return [block];

  /** Greedily pack `items` into as few same-kind blocks as fit. */
  const pack = (items, rebuild) => {
    const out = [];
    let cur = [];
    for (const item of items) {
      const trial = [...cur, item];
      if (cur.length && measure([rebuild(trial, out.length)]) > availH) {
        out.push(rebuild(cur, out.length));
        cur = [item];
      } else {
        cur = trial;
      }
    }
    if (cur.length) out.push(rebuild(cur, out.length));
    return out.length > 1 ? out : [block];
  };

  switch (block.t) {
    case 'list': {
      let consumed = 0;
      return pack(block.items, (items) => {
        const start = (block.start || 1) + consumed;
        consumed += items.length;
        // Numbering has to continue across the split, or a list that breaks
        // over two pages restarts at 1.
        return { ...block, start, items };
      });
    }

    case 'code':
      return pack(block.code.split('\n'), (lines) => ({ ...block, code: lines.join('\n') }));

    case 'table':
      // Repeat the header on every continuation so the columns stay readable.
      return pack(block.rows, (rows) => ({ ...block, rows }));

    case 'quote':
    case 'callout': {
      const inner = block.blocks.flatMap((b) => splitOversized(b, measure, availH * 0.82, depth + 1));
      if (inner.length > block.blocks.length) return inner.map((b) => ({ ...block, blocks: [b] }));
      return [block];
    }

    case 'para': {
      if (block.inlines.length > 1) {
        const mid = Math.ceil(block.inlines.length / 2);
        return [
          ...splitOversized({ ...block, inlines: block.inlines.slice(0, mid) }, measure, availH, depth + 1),
          ...splitOversized({ ...block, inlines: block.inlines.slice(mid) }, measure, availH, depth + 1),
        ];
      }
      const only = block.inlines[0];
      if (only?.t === 'text') {
        const words = only.text.split(' ');
        if (words.length > 1) {
          const mid = Math.ceil(words.length / 2);
          const half = (ws) => ({ ...block, inlines: [{ ...only, text: ws.join(' ') }] });
          return [
            ...splitOversized(half(words.slice(0, mid)), measure, availH, depth + 1),
            ...splitOversized(half(words.slice(mid)), measure, availH, depth + 1),
          ];
        }
      }
      return [block];
    }

    default:
      return [block];
  }
}

/**
 * Split blocks into pages that each fit at `root`.
 *
 * Only reached when a slide is too dense for the smallest readable size — at
 * which point more slides is the correct answer, not smaller type.
 */
function paginate(blocks, frame, theme, root, availH) {
  const pages = [];
  let current = [];

  const measure = (list) => layoutBlocks(list, {
    x: frame.contentX, y: frame.contentY, width: frame.contentW, root, theme, depth: 0,
  }, frame.contentY).height;

  const units = blocks.flatMap((b) => splitOversized(b, measure, availH));

  for (let i = 0; i < units.length; i++) {
    const block = units[i];
    const next = [...current, block];
    const h = measure(next);

    if (h > availH && current.length) {
      // Never leave a heading stranded at the foot of a page.
      const last = current[current.length - 1];
      if (last.t === 'heading' && current.length > 1) {
        current.pop();
        pages.push(current);
        current = [last, block];
      } else {
        pages.push(current);
        current = [block];
      }
    } else {
      current = next;
    }
  }

  if (current.length) pages.push(current);
  return pages.length ? pages : [blocks];
}

/* ------------------------------------------------------------------ *
 * Composition
 * ------------------------------------------------------------------ */

/**
 * Compose one slide's markdown into paintable pages.
 *
 * @param {string} markdown
 * @param {object} opts `{ width, height, theme, imageCache }`
 * @returns {{ pages: Array<{ops, bounds, root, weight}> }}
 */
export function composeSlide(markdown, opts) {
  const { width, height, imageCache = {} } = opts;
  const theme = typeof opts.theme === 'string' ? getTheme(opts.theme) : opts.theme || getTheme();
  const frame = frameMetrics(width, height);

  const { blocks, images } = parseSlide(markdown);

  const loaded = images
    .map((im) => imageCache[im.src])
    .filter((img) => img && img.naturalWidth > 0);
  const primary = loaded[0] || null;

  if (!blocks.length && !primary) {
    return { pages: [{ ops: [], bounds: [], root: Math.round(height * 0.03), weight: 1 }] };
  }

  const roots = ROOT_STEPS.map((f) => Math.round(height * f));

  // Largest root that fits wins; candidates at that root are ranked by score.
  for (const root of roots) {
    const fit = tryFit(blocks, primary, frame, theme, root);
    if (fit) {
      return { pages: [buildPage(fit, primary, loaded, frame, theme, root)] };
    }
  }

  // Nothing fits: paginate at the floor size, then re-fit the pages.
  const floor = roots[roots.length - 1];
  const chunks = paginate(blocks, frame, theme, floor, frame.contentH);

  const fitChunk = (chunk, img, allowed) => {
    for (const root of allowed) {
      const fit = tryFit(chunk, img, frame, theme, root);
      if (fit) return { fit, root };
    }
    return null;
  };

  // Every page of a split slide must share one type size. Fitting each page
  // independently maximises each in isolation but makes the slide visibly
  // change size mid-thought, so the smallest winning root sets the pace.
  const perPage = chunks.map((chunk, i) => fitChunk(chunk, i === 0 ? primary : null, roots));
  const common = Math.min(...perPage.map((p) => p?.root ?? floor));
  const allowed = roots.filter((r) => r <= common);

  const pages = chunks.map((chunk, i) => {
    const img = i === 0 ? primary : null;
    const picked = fitChunk(chunk, img, allowed.length ? allowed : [floor]);

    if (picked) return buildPage(picked.fit, img, i === 0 ? loaded : [], frame, theme, picked.root);

    // Unreachable in practice — splitOversized guarantees convergence — but a
    // page must never be dropped just because scoring rejected every candidate.
    const env = { x: frame.contentX, y: frame.contentY, width: frame.contentW, root: floor, theme, depth: 0 };
    const laid = layoutBlocks(chunk, env, frame.contentY);
    return buildPage(
      { cand: { mode: 'text', textW: frame.contentW, textH: frame.contentH }, laid },
      null, [], frame, theme, floor,
    );
  });

  return { pages };
}

function buildPage(fit, primary, loaded, frame, theme, root) {
  const { cand, laid } = fit;

  // Optical centring: pull short content up rather than pinning it to the top.
  const slack = Math.max(0, cand.textH - laid.height);
  const offset = Math.round(slack * VERTICAL_BIAS);

  const ops = laid.ops.map((op) => {
    const o = { ...op };
    if (o.y !== undefined) o.y += offset;
    if (o.points) o.points = o.points.map(([px, py]) => [px, py + offset]);
    if (o.cy !== undefined) { o.cy += offset; o.ey += offset; }
    return o;
  });

  const bounds = laid.bounds.map((b) => ({ ...b, top: b.top + offset, bottom: b.bottom + offset }));

  const imageOps = [];
  if (primary && cand.imageW) {
    const radius = root * 0.5;
    const extras = loaded.slice(1, 3);

    if (!extras.length) {
      imageOps.push(fitImage(primary, {
        x: cand.imageX, y: cand.imageY, w: cand.imageW, h: cand.imageH,
      }, radius, theme));
    } else {
      // Rare, but a slide can carry more than one figure: tile them.
      const all = [primary, ...extras];
      const gap = root * 0.5;
      const stacked = cand.stacked;
      const each = stacked
        ? { w: (cand.imageW - gap * (all.length - 1)) / all.length, h: cand.imageH }
        : { w: cand.imageW, h: (cand.imageH - gap * (all.length - 1)) / all.length };

      all.forEach((img, i) => {
        imageOps.push(fitImage(img, {
          x: cand.imageX + (stacked ? i * (each.w + gap) : 0),
          y: cand.imageY + (stacked ? 0 : i * (each.h + gap)),
          w: each.w, h: each.h,
        }, radius, theme));
      });
    }
  }

  // Weight drives how long each page of a split slide holds the narration.
  const weight = Math.max(1, laid.bounds.length) + (imageOps.length ? 1 : 0);

  return { ops: [...imageOps, ...ops], bounds, root, weight, imageCount: imageOps.length };
}

/* ------------------------------------------------------------------ *
 * Frame chrome
 * ------------------------------------------------------------------ */

/** Background wash. Drawn every frame before the content. */
export function paintBackground(ctx, { width, height, theme }) {
  const t = typeof theme === 'string' ? getTheme(theme) : theme;
  ctx.save();
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, width, height);

  // A barely-there corner wash keeps large flat areas from banding in video.
  const g = ctx.createLinearGradient(width, 0, width * 0.45, height);
  g.addColorStop(0, t.bgTint);
  g.addColorStop(1, t.bg);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Footer: slide counter and an overall progress rule.
 *
 * Drawn per frame rather than baked into the cached slide bitmap, because
 * `progress` advances continuously while the slide itself is static.
 */
export function paintChrome(ctx, { width, height, theme, index, total, progress, label }) {
  const t = typeof theme === 'string' ? getTheme(theme) : theme;
  const frame = frameMetrics(width, height);
  const size = Math.round(height * 0.0175);
  const y = height - frame.marginBottom * 0.52;
  const barH = Math.max(2, height * 0.0032);
  const barY = height - barH;

  ctx.save();

  ctx.fillStyle = t.ruleSoft;
  ctx.fillRect(0, barY, width, barH);
  ctx.fillStyle = t.accent;
  ctx.fillRect(0, barY, width * Math.max(0, Math.min(1, progress || 0)), barH);

  ctx.font = fontString({ weight: 600, size, family: FONTS.body });
  ctx.fillStyle = t.inkFaint;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  if (label) ctx.fillText(label, frame.marginX, y);

  if (total > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(`${index + 1} / ${total}`, width - frame.marginX, y);
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * Reveal
 * ------------------------------------------------------------------ */

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Paint a page with blocks appearing progressively.
 *
 * `t` runs 0..1 across the reveal window. Each block fades and lifts into
 * place in sequence, which is what makes the result read as a lesson being
 * written rather than a static image held for forty seconds.
 */
export function paintPage(ctx, page, { t = 1, stagger = true }) {
  if (!page) return;

  const imageOps = page.ops.slice(0, page.imageCount);
  const contentOps = page.ops.slice(page.imageCount);
  const bounds = page.bounds;

  if (!stagger || t >= 1 || !bounds.length) {
    paintOps(ctx, page.ops);
    return;
  }

  // Images establish the frame immediately; text follows.
  const imgAlpha = easeOut(Math.min(1, t / 0.22));
  paintOps(ctx, imageOps, { alpha: imgAlpha });

  const n = bounds.length;
  const slice = 1 / n;
  const overlap = 1.9; // neighbouring blocks overlap so the cadence feels fluid

  // Ops carry the index of their owning block, so grouping is exact rather
  // than inferred from coordinates.
  const groups = page.groups || (page.groups = contentOps.reduce((acc, op) => {
    const i = op.bi ?? 0;
    (acc[i] || (acc[i] = [])).push(op);
    return acc;
  }, {}));

  for (let i = 0; i < n; i++) {
    const start = i * slice;
    const local = Math.max(0, Math.min(1, (t - start) / (slice * overlap)));
    if (local <= 0) break;

    const eased = easeOut(local);
    const blockOps = groups[i];
    if (!blockOps) continue;

    paintOps(ctx, blockOps, {
      alpha: eased,
      offsetY: (1 - eased) * page.root * 0.5,
    });
  }
}

export { ensureFonts };
