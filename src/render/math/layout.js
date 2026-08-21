/**
 * Maths box layout.
 *
 * Every node becomes a box `{ w, a, d, ops }` — width, ascent and descent
 * measured from a baseline, plus paint operations positioned relative to that
 * baseline's origin. Boxes nest, so a fraction inside a radical inside a
 * superscript composes without any special cases, and the caller gets exact
 * metrics for free (which is what lets the slide fitter measure a formula
 * before deciding whether the slide fits).
 */

import { FONTS } from '../theme.js';
import { measureWidth, fontString } from '../fonts.js';

/** Inter-atom spacing in em, keyed by the pair of atom classes. */
const GAP = { rel: 0.26, bin: 0.2, punct: 0.14, open: 0, close: 0, ord: 0, num: 0, var: 0 };

const AXIS = 0.255;       // height of the fraction bar above the baseline, in em
const RULE = 0.055;       // fraction rule thickness, in em
const SCRIPT = 0.72;      // superscript / subscript size ratio
const MIN_SCRIPT = 0.45;

const shift = (ops, dx, dy) =>
  ops.map((op) => {
    const o = { ...op };
    if (o.x !== undefined) o.x += dx;
    if (o.y !== undefined) o.y += dy;
    if (o.x1 !== undefined) { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
    if (o.points) o.points = o.points.map(([px, py]) => [px + dx, py + dy]);
    return o;
  });

const emptyBox = () => ({ w: 0, a: 0, d: 0, ops: [] });

/**
 * @param {object} node   math AST node
 * @param {object} env    { size, color, display, level }
 */
export function layoutMath(node, env) {
  if (!node) return emptyBox();

  switch (node.t) {
    case 'row': return layoutRow(node, env);
    case 'sym': return layoutSym(node, env);
    case 'frac': return layoutFrac(node, env);
    case 'sqrt': return layoutSqrt(node, env);
    case 'supsub': return layoutSupSub(node, env);
    case 'bigop': return layoutBigOp(node, env);
    case 'accent': return layoutAccent(node, env);
    case 'styled': return layoutStyled(node, env);
    case 'delim': return layoutDelim(node, env);
    case 'matrix': return layoutMatrix(node, env);
    case 'space': return { w: node.em * env.size, a: 0, d: 0, ops: [] };
    default: return emptyBox();
  }
}

function fontFor(env, kind) {
  const italic = kind === 'var' && env.style !== 'rm' && env.style !== 'bb' && env.style !== 'sf';
  const weight = env.style === 'bf' || env.style === 'bfrm' ? 700 : 400;
  const family = env.style === 'sf' ? FONTS.body : FONTS.math;
  return fontString({ italic: italic || env.style === 'it', weight, size: env.size, family });
}

function layoutSym(node, env) {
  const font = fontFor(env, node.kind);
  const w = measureWidth(node.ch, font);
  // Maths glyphs sit within a predictable band; using the em box rather than
  // per-glyph ink keeps baselines from jittering between adjacent atoms.
  const a = env.size * 0.72;
  const d = env.size * 0.22;
  return {
    w, a, d, kind: node.kind,
    ops: [{ k: 'text', x: 0, y: 0, text: node.ch, font, fill: env.color }],
  };
}

function layoutRow(node, env) {
  const boxes = node.items.map((item) => layoutMath(item, env));
  let x = 0;
  let a = 0;
  let d = 0;
  const ops = [];

  boxes.forEach((box, i) => {
    if (i > 0) {
      const prev = boxes[i - 1];
      const left = GAP[prev.kind] ?? 0;
      const right = GAP[box.kind] ?? 0;
      // A leading sign ("-x") is unary, not binary — no space in front of it.
      const unary = box.kind === 'bin' && (i === 0 || ['bin', 'rel', 'open'].includes(prev.kind));
      x += unary ? 0 : Math.max(left, right) * env.size;
    }
    ops.push(...shift(box.ops, x, 0));
    x += box.w;
    a = Math.max(a, box.a);
    d = Math.max(d, box.d);
  });

  return {
    w: x, a, d, ops,
    kind: boxes.length === 1 ? boxes[0].kind : 'ord',
  };
}

function layoutFrac(node, env) {
  const inner = { ...env, size: env.size * (node.compact || env.cramped ? 0.85 : 1), cramped: true };
  const num = layoutMath(node.num, inner);
  const den = layoutMath(node.den, inner);

  const axis = env.size * AXIS;
  const rule = Math.max(1, env.size * RULE);
  const gap = env.size * 0.18;
  const pad = env.size * 0.12;

  const w = Math.max(num.w, den.w) + pad * 2;
  const numY = -(axis + rule / 2 + gap + num.d);
  const denY = -axis + rule / 2 + gap + den.a;

  const ops = [
    ...shift(num.ops, (w - num.w) / 2, numY),
    ...shift(den.ops, (w - den.w) / 2, denY),
  ];

  if (!node.noRule) {
    ops.push({
      k: 'rect', x: 0, y: -axis - rule / 2, w, h: rule, fill: env.color,
    });
  }

  return {
    w,
    a: -numY + num.a,
    d: denY + den.d,
    ops,
    kind: 'ord',
  };
}

function layoutSqrt(node, env) {
  const body = layoutMath(node.body, { ...env, cramped: true });
  const pad = env.size * 0.14;
  const gapTop = env.size * 0.16;
  const rule = Math.max(1, env.size * 0.05);

  const height = body.a + body.d + gapTop + rule;
  const hookW = env.size * 0.52;
  const bodyX = hookW + pad;
  const top = -(body.a + gapTop + rule);

  // The radical is drawn rather than typed: the glyph "√" does not stretch, so
  // a tall body (a fraction, say) would poke straight through it.
  const bottom = body.d;
  const ops = [
    ...shift(body.ops, bodyX, 0),
    {
      k: 'path',
      points: [
        [hookW * 0.06, bottom - height * 0.45],
        [hookW * 0.3, bottom - height * 0.3],
        [hookW * 0.62, bottom + env.size * 0.06],
        [hookW * 0.94, top + rule / 2],
        [bodyX + body.w + pad * 0.6, top + rule / 2],
      ],
      stroke: env.color,
      lw: rule,
      cap: 'round',
      join: 'round',
    },
  ];

  let w = bodyX + body.w + pad;
  let a = -top;

  if (node.index) {
    const idx = layoutMath(node.index, { ...env, size: env.size * 0.55 });
    const ix = -idx.w * 0.55 + hookW * 0.34;
    ops.push(...shift(idx.ops, Math.max(0, ix), top + rule + idx.d - env.size * 0.06));
    if (ix < 0) {
      // Index overhangs the hook: nudge the whole box right so nothing clips.
      const push = -ix;
      return {
        w: w + push, a: Math.max(a, -top + idx.a), d: bottom,
        ops: shift(ops, push, 0), kind: 'ord',
      };
    }
  }

  return { w, a, d: bottom, ops, kind: 'ord' };
}

function scriptEnv(env) {
  const size = Math.max(env.size * SCRIPT, env.rootSize * MIN_SCRIPT);
  return { ...env, size, level: (env.level || 0) + 1, cramped: true };
}

function layoutSupSub(node, env) {
  const base = layoutMath(node.base, env);
  const se = scriptEnv(env);
  const sup = node.sup ? layoutMath(node.sup, se) : null;
  const sub = node.sub ? layoutMath(node.sub, se) : null;

  const supShift = env.size * 0.44;
  const subShift = env.size * 0.2;
  const ops = [...base.ops];

  let a = base.a;
  let d = base.d;
  let w = base.w;
  const kern = env.size * 0.04;

  if (sup) {
    const y = -Math.max(supShift + sup.d, base.a * 0.82);
    ops.push(...shift(sup.ops, base.w + kern, y));
    a = Math.max(a, -y + sup.a);
    w = Math.max(w, base.w + kern + sup.w);
  }
  if (sub) {
    const y = Math.max(subShift + sub.a, base.d * 0.9);
    ops.push(...shift(sub.ops, base.w + kern, y));
    d = Math.max(d, y + sub.d);
    w = Math.max(w, base.w + kern + sub.w);
  }

  return { w: w + kern, a, d, ops, kind: base.kind === 'bigop' ? 'ord' : base.kind };
}

function layoutBigOp(node, env) {
  const display = env.display && !env.cramped;
  const opSize = node.word ? env.size : env.size * (display ? 1.45 : 1.2);
  const font = fontString({ weight: 400, size: opSize, family: node.word ? FONTS.body : FONTS.math });
  const opW = measureWidth(node.ch, font);
  const opA = opSize * (node.word ? 0.72 : 0.78);
  const opD = opSize * (node.word ? 0.2 : 0.26);

  const se = scriptEnv(env);
  const sup = node.sup ? layoutMath(node.sup, se) : null;
  const sub = node.sub ? layoutMath(node.sub, se) : null;

  if (!sup && !sub) {
    return {
      w: opW, a: opA, d: opD, kind: 'bigop',
      ops: [{ k: 'text', x: 0, y: 0, text: node.ch, font, fill: env.color }],
    };
  }

  if (!display) {
    // Inline: limits ride alongside as ordinary scripts so line height holds.
    return layoutSupSub(
      { t: 'supsub', base: { t: 'sym', ch: node.ch, kind: 'bigop' }, sup: node.sup, sub: node.sub },
      env,
    );
  }

  const w = Math.max(opW, sup?.w || 0, sub?.w || 0);
  const gap = env.size * 0.14;
  const ops = [{ k: 'text', x: (w - opW) / 2, y: 0, text: node.ch, font, fill: env.color }];

  let a = opA;
  let d = opD;

  if (sup) {
    const y = -(opA + gap + sup.d);
    ops.push(...shift(sup.ops, (w - sup.w) / 2, y));
    a = -y + sup.a;
  }
  if (sub) {
    const y = opD + gap + sub.a;
    ops.push(...shift(sub.ops, (w - sub.w) / 2, y));
    d = y + sub.d;
  }

  return { w, a, d, ops, kind: 'bigop' };
}

function layoutAccent(node, env) {
  const body = layoutMath(node.body, env);
  const gap = env.size * 0.06;
  const y = -(body.a + gap);
  const ops = [...body.ops];
  const lw = Math.max(1, env.size * 0.05);
  const cx = body.w / 2;

  switch (node.mark) {
    case '⃗': {
      const h = env.size * 0.1;
      ops.push({ k: 'path', points: [[0, y], [body.w, y]], stroke: env.color, lw, cap: 'round' });
      ops.push({ k: 'path', points: [[body.w - h, y - h * 0.8], [body.w, y], [body.w - h, y + h * 0.8]], stroke: env.color, lw, cap: 'round', join: 'round' });
      break;
    }
    case '̄':
      ops.push({ k: 'path', points: [[0, y], [body.w, y]], stroke: env.color, lw, cap: 'round' });
      break;
    case '̂': {
      const half = Math.min(body.w / 2, env.size * 0.26);
      ops.push({ k: 'path', points: [[cx - half, y], [cx, y - env.size * 0.14], [cx + half, y]], stroke: env.color, lw, cap: 'round', join: 'round' });
      break;
    }
    case '̃': {
      const half = Math.min(body.w / 2, env.size * 0.28);
      ops.push({ k: 'path', points: [[cx - half, y], [cx - half / 2, y - env.size * 0.1], [cx + half / 2, y], [cx + half, y - env.size * 0.1]], stroke: env.color, lw, cap: 'round', join: 'round' });
      break;
    }
    case '̇':
    case '̈': {
      const r = Math.max(1, env.size * 0.05);
      const xs = node.mark === '̇' ? [cx] : [cx - env.size * 0.11, cx + env.size * 0.11];
      xs.forEach((dx) => ops.push({ k: 'dot', x: dx, y: y - r, r, fill: env.color }));
      break;
    }
    default:
      break;
  }

  return { w: body.w, a: -y + env.size * 0.16, d: body.d, ops, kind: 'ord' };
}

function layoutStyled(node, env) {
  const inner = { ...env, style: node.style };

  // \text{...} and function names are set as real words so the shaper can kern
  // them, instead of one isolated glyph per letter.
  if (node.style === 'rm' || node.style === 'bfrm' || node.fn) {
    const text = collectText(node.body);
    if (text) {
      const font = fontString({
        weight: node.style === 'bfrm' ? 700 : 400,
        size: env.size,
        family: node.fn ? FONTS.math : FONTS.body,
      });
      return {
        w: measureWidth(text, font),
        a: env.size * 0.72,
        d: env.size * 0.22,
        kind: node.fn ? 'ord' : 'ord',
        ops: [{ k: 'text', x: 0, y: 0, text, font, fill: env.color }],
      };
    }
  }

  return layoutMath(node.body, inner);
}

function collectText(node) {
  if (!node) return '';
  if (node.t === 'sym') return node.ch;
  if (node.t === 'row') return node.items.map(collectText).join('');
  if (node.t === 'space') return ' ';
  if (node.t === 'styled') return collectText(node.body);
  return '';
}

function layoutDelim(node, env) {
  const body = layoutMath(node.body, env);
  const axis = env.size * AXIS;
  // Delimiters grow to cover the body, measured symmetrically about the axis.
  const reach = Math.max(body.a - axis, body.d + axis, env.size * 0.5);
  const targetH = (reach + env.size * 0.12) * 2;
  const naturalH = env.size * 1.0;
  const scaleY = Math.max(1, targetH / naturalH);

  const font = fontString({ weight: 400, size: env.size, family: FONTS.math });
  const ops = [];
  let x = 0;

  const drawDelim = (ch) => {
    if (!ch) return 0;
    const w = measureWidth(ch, font) * Math.min(1 + (scaleY - 1) * 0.12, 1.35);
    ops.push({
      k: 'text', x, y: -axis, text: ch, font, fill: env.color,
      scaleY, scaleX: Math.min(1 + (scaleY - 1) * 0.12, 1.35), originY: -axis,
    });
    return w;
  };

  x += drawDelim(node.left);
  const pad = node.left ? env.size * 0.06 : 0;
  x += pad;
  ops.push(...shift(body.ops, x, 0));
  x += body.w + (node.right ? env.size * 0.06 : 0);
  x += drawDelim(node.right);

  const half = targetH / 2;
  return {
    w: x,
    a: Math.max(body.a, half + axis),
    d: Math.max(body.d, half - axis),
    ops,
    kind: 'ord',
  };
}

function layoutMatrix(node, env) {
  const inner = { ...env, size: env.size * 0.98, display: false };
  const grid = node.rows.map((row) => row.map((cell) => layoutMath(cell, inner)));

  const cols = Math.max(0, ...grid.map((r) => r.length));
  const colW = Array.from({ length: cols }, (_, c) =>
    Math.max(0, ...grid.map((r) => r[c]?.w || 0)));

  const rowGap = env.size * 0.4;
  const colGap = env.size * 0.7;

  const rowH = grid.map((r) => ({
    a: Math.max(env.size * 0.7, ...r.map((c) => c.a)),
    d: Math.max(env.size * 0.22, ...r.map((c) => c.d)),
  }));

  const totalH = rowH.reduce((s, r, i) => s + r.a + r.d + (i ? rowGap : 0), 0);
  const bodyW = colW.reduce((s, w) => s + w, 0) + colGap * Math.max(0, cols - 1);
  const axis = env.size * AXIS;

  const ops = [];
  let y = -(totalH / 2) - axis;

  grid.forEach((row, ri) => {
    y += rowH[ri].a;
    let x = 0;
    row.forEach((cell, ci) => {
      const slot = colW[ci];
      const dx = node.align === 'left' ? 0 : (slot - cell.w) / 2;
      ops.push(...shift(cell.ops, x + dx, y));
      x += slot + colGap;
    });
    y += rowH[ri].d + rowGap;
  });

  const half = totalH / 2;
  const bracketLw = Math.max(1, env.size * 0.06);
  let offsetX = 0;

  const bracket = (ch, side) => {
    if (!ch) return 0;
    const w = env.size * 0.3;
    const top = -half - axis;
    const bot = half - axis;
    const lip = w * 0.55;
    const dir = side === 'left' ? 1 : -1;
    const bx = side === 'left' ? 0 : bodyW + offsetX + w;

    if (ch === '(' || ch === ')') {
      ops.push({
        k: 'curve',
        x: bx + (side === 'left' ? w : -w), y: top,
        cx: bx + (side === 'left' ? -w * 0.3 : w * 0.3), cy: 0 - axis,
        ex: bx + (side === 'left' ? w : -w), ey: bot,
        stroke: env.color, lw: bracketLw,
      });
    } else if (ch === '|' || ch === '‖') {
      const xs = ch === '|' ? [bx + (side === 'left' ? w * 0.5 : -w * 0.5)] :
        [bx + (side === 'left' ? w * 0.3 : -w * 0.3), bx + (side === 'left' ? w * 0.7 : -w * 0.7)];
      xs.forEach((px) => ops.push({ k: 'path', points: [[px, top], [px, bot]], stroke: env.color, lw: bracketLw }));
    } else {
      ops.push({
        k: 'path',
        points: [
          [bx + dir * lip, top], [bx, top], [bx, bot], [bx + dir * lip, bot],
        ],
        stroke: env.color, lw: bracketLw, join: 'miter',
      });
    }
    return w;
  };

  if (node.left) {
    const w = env.size * 0.34;
    const shifted = shift(ops, w, 0);
    ops.length = 0;
    ops.push(...shifted);
    offsetX = w;
    bracket(node.left, 'left');
  }
  if (node.right) bracket(node.right, 'right');

  const totalW = bodyW + offsetX + (node.right ? env.size * 0.34 : 0);
  return { w: totalW, a: half + axis, d: half - axis, ops, kind: 'ord' };
}

/**
 * Public entry: lay out a TeX string at a given size.
 *
 * @returns {{ w:number, a:number, d:number, ops:Array }}
 */
export function measureMath(ast, { size, color, display = false }) {
  const env = { size, rootSize: size, color, display, level: 0, style: null, cramped: false };
  const box = layoutMath(ast, env);
  return {
    w: Math.ceil(box.w),
    a: box.a,
    d: box.d,
    ops: box.ops,
  };
}
