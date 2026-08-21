/**
 * Block and inline layout.
 *
 * Nothing here touches a real canvas. Every function returns a height plus a
 * list of absolutely-positioned paint operations, which is what makes the
 * two-pass fitter possible: the slide can be laid out at six different sizes,
 * measured each time, and only the winning pass is ever painted.
 */

import { FONTS, SCALE, RHYTHM } from './theme.js';
import { measureWidth, fontString, fontMetrics, tokenizeWords, truncateToWidth } from './fonts.js';
import { parseMath } from './math/parse.js';
import { measureMath } from './math/layout.js';
import { highlightCode } from './code.js';

const shiftOps = (ops, dx, dy) =>
  ops.map((op) => {
    const o = { ...op };
    if (o.x !== undefined) o.x += dx;
    if (o.y !== undefined) o.y += dy;
    if (o.points) o.points = o.points.map(([px, py]) => [px + dx, py + dy]);
    if (o.cx !== undefined) { o.cx += dx; o.cy += dy; o.ex += dx; o.ey += dy; }
    return o;
  });

/* ------------------------------------------------------------------ *
 * Inline layout
 * ------------------------------------------------------------------ */

const runFont = (style, env) => {
  if (style.code) {
    return fontString({ weight: 500, size: env.size * 0.92, family: FONTS.mono });
  }
  return fontString({
    italic: style.i,
    weight: style.b ? (env.weight >= 700 ? 800 : 700) : env.weight,
    size: env.size,
    family: env.family,
  });
};

const runColor = (style, env) => {
  if (style.color) return env.theme.swatch[style.color] || env.color;
  if (style.mark) return env.theme.markInk;
  if (style.code) return env.theme.accentInk;
  return env.color;
};

/**
 * Turn styled runs into atoms — the indivisible units line breaking works with.
 */
function buildAtoms(runs, env) {
  const atoms = [];

  for (const run of runs) {
    if (run.t === 'br') {
      atoms.push({ kind: 'break' });
      continue;
    }

    if (run.t === 'math') {
      const ast = parseMath(run.tex);
      const box = measureMath(ast, {
        size: env.size * 0.98,
        color: runColor(run.s, env),
        display: false,
      });
      atoms.push({
        kind: 'math', box, s: run.s,
        w: box.w, wTrim: box.w, a: box.a, d: box.d,
      });
      continue;
    }

    const font = runFont(run.s, env);
    const fill = runColor(run.s, env);
    const metrics = fontMetrics(font);

    for (const word of tokenizeWords(run.text)) {
      if (!word) continue;
      const trimmed = word.replace(/\s+$/, '');
      atoms.push({
        kind: 'word',
        text: word,
        trimmed,
        font,
        fill,
        s: run.s,
        w: measureWidth(word, font),
        wTrim: measureWidth(trimmed, font),
        a: metrics.ascent,
        d: metrics.descent,
        space: word !== trimmed,
      });
    }
  }

  return atoms;
}

/**
 * Greedy line breaking with a hard-split fallback for atoms wider than the
 * column (a long URL, or a formula on a narrow image-split slide).
 */
function breakLines(atoms, width) {
  const lines = [];
  let line = [];
  let x = 0;

  const push = () => {
    // Drop the trailing space so centred and right-aligned text sits correctly.
    while (line.length && line[line.length - 1].kind === 'word' && !line[line.length - 1].trimmed) line.pop();
    lines.push(line);
    line = [];
    x = 0;
  };

  for (const atom of atoms) {
    if (atom.kind === 'break') { push(); continue; }

    if (x > 0 && x + atom.wTrim > width + 0.5) push();

    if (atom.wTrim > width && atom.kind === 'word') {
      // Single atom too wide even on its own line: split it by graphemes.
      let rest = atom.text;
      while (rest && measureWidth(rest, atom.font) > width) {
        const head = truncateToWidth(rest, atom.font, width);
        if (!head || head.length === rest.length) break;
        const w = measureWidth(head, atom.font);
        line.push({ ...atom, text: head, trimmed: head, w, wTrim: w, space: false });
        push();
        rest = rest.slice(head.length);
      }
      if (rest) {
        const w = measureWidth(rest, atom.font);
        line.push({ ...atom, text: rest, trimmed: rest.replace(/\s+$/, ''), w, wTrim: measureWidth(rest.replace(/\s+$/, ''), atom.font) });
        x += w;
      }
      continue;
    }

    line.push(atom);
    x += atom.w;
  }

  if (line.length) push();
  return lines.filter((l, i) => l.length || i === 0);
}

/** Merge neighbouring atoms sharing a style so a highlight is one clean pill. */
function decorate(placed, env, baseline, lineA, lineD) {
  const ops = [];
  let i = 0;

  while (i < placed.length) {
    const { atom } = placed[i];
    const s = atom.s;
    if (!s || (!s.mark && !s.strike && !s.code)) { i++; continue; }

    let j = i;
    let x0 = placed[i].x;
    let x1 = placed[i].x + placed[i].atom.wTrim;
    while (j + 1 < placed.length && placed[j + 1].atom.s === s) {
      j++;
      x1 = placed[j].x + placed[j].atom.wTrim;
    }

    const padX = env.size * (s.code ? 0.26 : 0.18);
    const padY = env.size * 0.16;

    if (s.mark) {
      ops.unshift({
        k: 'rect',
        x: x0 - padX, y: baseline - lineA - padY * 0.4,
        w: x1 - x0 + padX * 2, h: lineA + lineD + padY * 0.8,
        fill: env.theme.markBg, r: env.size * 0.16,
      });
    }
    if (s.code) {
      ops.unshift({
        k: 'rect',
        x: x0 - padX, y: baseline - lineA - padY * 0.3,
        w: x1 - x0 + padX * 2, h: lineA + lineD + padY * 0.6,
        fill: env.theme.codeBg, r: env.size * 0.2,
        stroke: env.theme.codeBorder, lw: 1,
      });
    }
    if (s.strike) {
      ops.push({
        k: 'path',
        points: [[x0, baseline - env.size * 0.26], [x1, baseline - env.size * 0.26]],
        stroke: runColor(s, env), lw: Math.max(1, env.size * 0.055), cap: 'round',
      });
    }

    i = j + 1;
  }

  return ops;
}

/**
 * Lay out styled runs into a column.
 *
 * @param {Array}  runs   inline runs from the parser
 * @param {object} env    { x, y, width, size, weight, family, color, theme, align, lineHeight }
 */
export function layoutInline(runs, env) {
  const atoms = buildAtoms(runs, env);
  const lines = breakLines(atoms, env.width);
  const lh = env.lineHeight ?? RHYTHM.lineHeight;

  const ops = [];
  let y = env.y;

  for (const line of lines) {
    const lineA = Math.max(env.size * 0.78, ...line.map((a) => a.a), 0);
    const lineD = Math.max(env.size * 0.22, ...line.map((a) => a.d), 0);
    const slot = Math.max(env.size * lh, lineA + lineD);
    const baseline = y + (slot - (lineA + lineD)) / 2 + lineA;

    const lineW = line.reduce((s, a, i) => s + (i === line.length - 1 ? a.wTrim : a.w), 0);
    let x = env.x;
    if (env.align === 'center') x += (env.width - lineW) / 2;
    else if (env.align === 'right') x += env.width - lineW;

    const placed = [];
    for (const atom of line) {
      placed.push({ atom, x });
      x += atom.w;
    }

    ops.push(...decorate(placed, env, baseline, lineA, lineD));

    for (const { atom, x: ax } of placed) {
      if (atom.kind === 'math') {
        ops.push(...shiftOps(atom.box.ops, ax, baseline));
      } else if (atom.trimmed) {
        ops.push({ k: 'text', x: ax, y: baseline, text: atom.trimmed, font: atom.font, fill: atom.fill });
      }
    }

    y += slot;
  }

  return { height: y - env.y, ops, lineCount: lines.length };
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

const headingScale = (level) => [SCALE.h1, SCALE.h2, SCALE.h3, SCALE.h4, SCALE.h4, SCALE.h4][level - 1] || SCALE.h4;

function layoutHeading(block, env, y) {
  const size = env.root * headingScale(block.level);
  const isTitle = block.level === 1;

  const res = layoutInline(block.inlines, {
    x: env.x, y, width: env.width,
    size,
    weight: isTitle ? 800 : 700,
    family: FONTS.display,
    color: block.level <= 2 ? env.theme.ink : env.theme.accentInk,
    theme: env.theme,
    lineHeight: RHYTHM.headingLineHeight,
  });

  const ops = res.ops;
  let height = res.height;

  if (isTitle) {
    // A short accent rule under the title reads as deliberate structure and
    // costs almost no vertical space.
    const gap = env.root * 0.38;
    ops.push({
      k: 'rect',
      x: env.x, y: y + height + gap,
      w: Math.min(env.width, env.root * 2.6), h: Math.max(2, env.root * 0.11),
      fill: env.theme.accent, r: env.root * 0.06,
    });
    height += gap + Math.max(2, env.root * 0.11);
  }

  return { height, ops };
}

function layoutPara(block, env, y) {
  return layoutInline(block.inlines, {
    x: env.x, y, width: env.width,
    size: env.root,
    weight: 400,
    family: FONTS.body,
    color: env.theme.inkSoft,
    theme: env.theme,
  });
}

function layoutHr(block, env, y) {
  const pad = env.root * 0.5;
  return {
    height: pad * 2 + 1,
    ops: [{ k: 'rect', x: env.x, y: y + pad, w: env.width, h: 1, fill: env.theme.rule }],
  };
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

function markerFor(list, index, depth) {
  if (list.ordered) {
    const n = (list.start || 1) + index;
    const text = depth === 0 ? `${n}.` : `${ROMAN[n - 1] || n}.`;
    return { type: 'text', text };
  }
  return { type: ['disc', 'ring', 'dash'][depth % 3] };
}

function layoutList(block, env, y) {
  const ops = [];
  const indent = env.root * RHYTHM.listIndent;
  const markerFont = fontString({ weight: 600, size: env.root * 0.94, family: FONTS.body });
  let cursor = y;

  block.items.forEach((item, i) => {
    if (i > 0) cursor += env.root * RHYTHM.listGap;

    const inner = layoutBlocks(item.blocks, {
      ...env,
      x: env.x + indent,
      width: env.width - indent,
      depth: (env.depth || 0) + 1,
      tight: true,
    }, cursor);

    // Vertically centre the marker on the first line of the item.
    const firstLineMid = cursor + env.root * RHYTHM.lineHeight * 0.5;
    const marker = markerFor(block, i, env.depth || 0);
    const mx = env.x + indent * 0.42;

    if (marker.type === 'text') {
      const w = measureWidth(marker.text, markerFont);
      ops.push({
        k: 'text',
        x: env.x + indent - env.root * RHYTHM.markerGap - w,
        y: firstLineMid + env.root * 0.32,
        text: marker.text, font: markerFont, fill: env.theme.accent,
      });
    } else if (marker.type === 'disc') {
      ops.push({ k: 'dot', x: mx, y: firstLineMid, r: env.root * 0.14, fill: env.theme.accent });
    } else if (marker.type === 'ring') {
      ops.push({ k: 'dot', x: mx, y: firstLineMid, r: env.root * 0.13, stroke: env.theme.accent, lw: Math.max(1.2, env.root * 0.075) });
    } else {
      ops.push({
        k: 'rect',
        x: mx - env.root * 0.16, y: firstLineMid - env.root * 0.04,
        w: env.root * 0.32, h: Math.max(1.5, env.root * 0.08),
        fill: env.theme.inkFaint, r: 1,
      });
    }

    ops.push(...inner.ops);
    cursor += inner.height;
  });

  return { height: cursor - y, ops };
}

function layoutCode(block, env, y) {
  const padX = env.root * 0.72;
  const padY = env.root * 0.6;
  const innerW = env.width - padX * 2;

  const lines = block.code.split('\n');
  const gutterDigits = String(lines.length).length;
  const showGutter = lines.length > 2;

  // Shrink until the longest line fits, rather than clipping it.
  let size = env.root * SCALE.code;
  let font = fontString({ weight: 400, size, family: FONTS.mono });
  let gutterW = showGutter ? measureWidth('0'.repeat(gutterDigits) + '  ', font) : 0;
  let longest = Math.max(0, ...lines.map((l) => measureWidth(l, font)));

  let guard = 0;
  while (longest + gutterW > innerW && size > env.root * 0.5 && guard++ < 24) {
    size *= 0.94;
    font = fontString({ weight: 400, size, family: FONTS.mono });
    gutterW = showGutter ? measureWidth('0'.repeat(gutterDigits) + '  ', font) : 0;
    longest = Math.max(0, ...lines.map((l) => measureWidth(l, font)));
  }

  const lineH = size * RHYTHM.codeLineHeight;
  const labelH = block.lang ? size * 1.5 : 0;
  const height = padY * 2 + labelH + lines.length * lineH;

  const ops = [{
    k: 'rect', x: env.x, y, w: env.width, h: height,
    fill: env.theme.codeBg, stroke: env.theme.codeBorder, lw: 1, r: env.root * 0.42,
  }];

  if (block.lang) {
    const labelFont = fontString({ weight: 700, size: size * 0.78, family: FONTS.mono });
    ops.push({
      k: 'text',
      x: env.x + padX, y: y + padY + size * 0.82,
      text: block.lang.toUpperCase(), font: labelFont, fill: env.theme.codeGutter,
    });
  }

  const highlighted = highlightCode(block.code, block.lang);
  const gutterFont = fontString({ weight: 400, size: size * 0.9, family: FONTS.mono });

  highlighted.forEach((spans, i) => {
    const baseline = y + padY + labelH + i * lineH + size * 0.98;
    let x = env.x + padX;

    if (showGutter) {
      const num = String(i + 1).padStart(gutterDigits, ' ');
      ops.push({ k: 'text', x, y: baseline, text: num, font: gutterFont, fill: env.theme.codeGutter });
      x += gutterW;
    }

    for (const span of spans) {
      if (!span.text) continue;
      const fill = span.type === 'plain' ? env.theme.codeInk : env.theme.syntax[span.type] || env.theme.codeInk;
      const spanFont = span.type === 'keyword'
        ? fontString({ weight: 700, size, family: FONTS.mono })
        : font;
      ops.push({ k: 'text', x, y: baseline, text: span.text, font: spanFont, fill });
      x += measureWidth(span.text, spanFont);
    }
  });

  return { height, ops };
}

function layoutMathBlock(block, env, y) {
  const ast = parseMath(block.tex);
  let size = env.root * 1.16;
  let box = measureMath(ast, { size, color: env.theme.ink, display: true });

  let guard = 0;
  while (box.w > env.width && size > env.root * 0.5 && guard++ < 24) {
    size *= 0.93;
    box = measureMath(ast, { size, color: env.theme.ink, display: true });
  }

  const padY = env.root * 0.42;
  const height = box.a + box.d + padY * 2;
  const baseline = y + padY + box.a;
  const x = env.x + Math.max(0, (env.width - box.w) / 2);

  return { height, ops: shiftOps(box.ops, x, baseline) };
}

function layoutQuote(block, env, y) {
  const barW = Math.max(3, env.root * 0.16);
  const padX = env.root * 0.8;
  const padY = env.root * 0.5;

  const inner = layoutBlocks(block.blocks, {
    ...env,
    x: env.x + barW + padX,
    width: env.width - barW - padX * 2,
    tight: true,
    quoteInk: true,
  }, y + padY);

  const height = inner.height + padY * 2;

  return {
    height,
    ops: [
      { k: 'rect', x: env.x, y, w: env.width, h: height, fill: env.theme.quoteBg, r: env.root * 0.3 },
      { k: 'rect', x: env.x, y, w: barW, h: height, fill: env.theme.quoteBar, r: barW / 2 },
      ...inner.ops,
    ],
  };
}

function layoutCallout(block, env, y) {
  const tone = env.theme.callout[block.kind] || env.theme.callout.note;
  const barW = Math.max(3, env.root * 0.16);
  const padX = env.root * 0.78;
  const padY = env.root * 0.62;
  const iconSize = env.root * 1.02;
  const iconGap = env.root * 1.5;

  const themed = { ...env.theme, ink: tone.ink, inkSoft: tone.ink, accent: tone.bar, accentInk: tone.bar };

  const inner = layoutBlocks(block.blocks, {
    ...env,
    theme: themed,
    x: env.x + barW + padX + iconGap,
    width: env.width - barW - padX * 2 - iconGap,
    tight: true,
  }, y + padY);

  const height = inner.height + padY * 2;
  const iconFont = fontString({ weight: 700, size: iconSize, family: FONTS.body });

  return {
    height,
    ops: [
      { k: 'rect', x: env.x, y, w: env.width, h: height, fill: tone.bg, r: env.root * 0.34 },
      { k: 'rect', x: env.x, y, w: barW, h: height, fill: tone.bar, r: barW / 2 },
      {
        k: 'text',
        x: env.x + barW + padX,
        y: y + padY + env.root * 0.95,
        text: tone.icon, font: iconFont, fill: tone.bar,
      },
      ...inner.ops,
    ],
  };
}

function layoutTable(block, env, y) {
  const size = env.root * SCALE.table;
  const padX = size * 0.62;
  const padY = size * 0.44;
  const cols = Math.max(block.head.length, ...block.rows.map((r) => r.length), 1);

  const cellEnv = (width, weight, color) => ({
    width, size, weight, family: FONTS.body, color, theme: env.theme,
    lineHeight: 1.34, x: 0, y: 0,
  });

  // Natural width of each column, then shrink proportionally to fit.
  const natural = Array.from({ length: cols }, (_, c) => {
    const cells = [block.head[c], ...block.rows.map((r) => r[c])].filter(Boolean);
    return Math.max(
      size * 2,
      ...cells.map((runs) => {
        const atoms = buildAtoms(runs, cellEnv(1e6, 400, env.theme.ink));
        return atoms.reduce((s, a) => s + a.w, 0);
      }),
    ) + padX * 2;
  });

  const naturalTotal = natural.reduce((s, w) => s + w, 0);
  let widths = natural;
  if (naturalTotal > env.width) {
    const floor = size * 3.4;
    const flexible = natural.map((w) => Math.max(0, w - floor));
    const flexTotal = flexible.reduce((s, w) => s + w, 0);
    const excess = naturalTotal - env.width;
    widths = natural.map((w, i) =>
      flexTotal > 0 ? w - (flexible[i] / flexTotal) * Math.min(excess, flexTotal) : w);
  } else if (naturalTotal < env.width) {
    const bonus = (env.width - naturalTotal) / cols;
    widths = natural.map((w) => w + bonus);
  }

  const ops = [];
  let cursor = y;

  const renderRow = (cells, opts) => {
    const heights = [];
    const rowOps = [];
    let x = env.x;

    for (let c = 0; c < cols; c++) {
      const runs = cells[c] || [];
      const innerW = widths[c] - padX * 2;
      const res = layoutInline(runs, {
        ...cellEnv(innerW, opts.weight, opts.color),
        x: x + padX,
        y: cursor + padY,
        align: block.align[c] === 'left' ? 'left' : block.align[c],
      });
      heights.push(res.height);
      rowOps.push(...res.ops);
      x += widths[c];
    }

    const rowH = Math.max(size * 1.5, ...heights) + padY * 2;

    if (opts.fill) {
      ops.push({ k: 'rect', x: env.x, y: cursor, w: env.width, h: rowH, fill: opts.fill });
    }
    ops.push(...rowOps);

    if (opts.rule) {
      ops.push({ k: 'rect', x: env.x, y: cursor + rowH, w: env.width, h: 1, fill: opts.rule });
    }
    cursor += rowH;
  };

  const hasHead = block.head.length > 0;
  if (hasHead) {
    renderRow(block.head, {
      weight: 700, color: env.theme.ink,
      fill: env.theme.tableHeadBg, rule: env.theme.rule,
    });
  }

  block.rows.forEach((row, i) => {
    renderRow(row, {
      weight: 400, color: env.theme.inkSoft,
      fill: i % 2 === 1 ? env.theme.tableZebra : null,
      rule: i < block.rows.length - 1 ? env.theme.ruleSoft : null,
    });
  });

  const height = cursor - y;

  // Outline last so it sits above the zebra fills.
  ops.push({
    k: 'rect', x: env.x, y, w: env.width, h: height,
    stroke: env.theme.rule, lw: 1, r: env.root * 0.3,
  });

  return { height, ops };
}

const LAYOUTS = {
  heading: layoutHeading,
  para: layoutPara,
  list: layoutList,
  code: layoutCode,
  mathBlock: layoutMathBlock,
  quote: layoutQuote,
  callout: layoutCallout,
  table: layoutTable,
  hr: layoutHr,
};

/** Space between two adjacent blocks, in root ems. */
function gapBetween(prev, next, env) {
  if (!prev) return 0;
  const r = env.root;
  if (next.t === 'heading') return r * (env.tight ? RHYTHM.headingGapAfter : RHYTHM.headingGapBefore);
  if (prev.t === 'heading') return r * RHYTHM.headingGapAfter;
  if (env.tight) return r * RHYTHM.paraGap * 0.7;
  if (prev.t === next.t && next.t === 'para') return r * RHYTHM.paraGap;
  return r * RHYTHM.blockGap;
}

/**
 * Stack blocks vertically from `startY`.
 *
 * `bounds` records each block's band so the video renderer can reveal blocks
 * one at a time without re-laying anything out.
 */
export function layoutBlocks(blocks, env, startY = env.y || 0) {
  const ops = [];
  const bounds = [];
  let y = startY;
  let prev = null;

  for (const block of blocks) {
    const fn = LAYOUTS[block.t];
    if (!fn) continue;

    y += gapBetween(prev, block, env);
    const top = y;
    const res = fn(block, env, y);

    // Tag every op with the index of the top-level block it belongs to. Nested
    // calls tag first and the outer pass overwrites, so a bullet's ops end up
    // attributed to the list rather than to themselves — which is what the
    // progressive reveal needs in order to fade whole blocks in sequence.
    const index = bounds.length;
    for (const op of res.ops) op.bi = index;

    ops.push(...res.ops);
    y += res.height;
    bounds.push({ top, bottom: y, type: block.t });
    prev = block;
  }

  return { height: y - startY, ops, bounds };
}
