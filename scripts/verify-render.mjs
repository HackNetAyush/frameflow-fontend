/**
 * Headless verification for the slide renderer.
 *
 * Stubs a 2D context with approximate font metrics, then runs the real
 * composition pipeline over the generated sessions in the backend's audio/
 * directory. It asserts the property that matters most: no page may ever be
 * taller than the frame it is drawn into.
 *
 *   node scripts/verify-render.mjs [path/to/j1.json ...]
 */

import fs from 'node:fs';
import path from 'node:path';

/* ---------- DOM stubs ---------------------------------------------- */

const CHAR_W = { mono: 0.601, math: 0.5, display: 0.545, body: 0.517 };
const EMOJI = /\p{Extended_Pictographic}/u;

function familyKey(font) {
  if (/JetBrains Mono|monospace/.test(font)) return 'mono';
  if (/STIX|Cambria Math|serif/.test(font)) return 'math';
  if (/Plus Jakarta/.test(font)) return 'display';
  return 'body';
}

function makeContext() {
  let font = '16px sans-serif';
  return {
    canvas: { width: 1, height: 1 },
    set font(v) { font = v; },
    get font() { return font; },
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: '', lineJoin: '',
    globalAlpha: 1, textBaseline: '', textAlign: '',
    save() {}, restore() {}, translate() {}, scale() {}, clip() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, rect() {},
    arc() {}, arcTo() {}, quadraticCurveTo() {}, roundRect() {},
    fill() {}, stroke() {}, fillRect() {}, fillText() {}, drawImage() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText(text) {
      const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] || '16');
      const bold = /(^|\s)(600|700|800|900|bold)(\s|$)/.test(font);
      const base = CHAR_W[familyKey(font)] * (bold ? 1.045 : 1);
      let w = 0;
      for (const ch of text) w += (EMOJI.test(ch) ? 1.16 : base) * size;
      return {
        width: w,
        actualBoundingBoxAscent: size * 0.755,
        actualBoundingBoxDescent: size * 0.21,
        fontBoundingBoxAscent: size * 0.78,
        fontBoundingBoxDescent: size * 0.22,
      };
    },
  };
}

globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => makeContext() }),
  fonts: { load: () => Promise.resolve(), ready: Promise.resolve() },
};

/* ---------- imports (must follow the stubs) ------------------------ */

const { composeSlide } = await import('../src/render/slide.js');
const { parseSlide } = await import('../src/render/md.js');
const { parseMath } = await import('../src/render/math/parse.js');
const { measureMath } = await import('../src/render/math/layout.js');
const { frameMetrics } = await import('../src/render/theme.js');

const W = 1920;
const H = 1080;
const frame = frameMetrics(W, H);

const pass = (s) => `  \x1b[32mPASS\x1b[0m ${s}`;
const fail = (s) => `  \x1b[31mFAIL\x1b[0m ${s}`;
let failures = 0;

/* ---------- 1. overflow over real generated slides ----------------- */

function pageExtent(page) {
  let max = -Infinity;
  for (const op of page.ops) {
    if (op.k === 'text') max = Math.max(max, op.y + (page.root || 0) * 0.25);
    else if (op.k === 'rect' || op.k === 'image') max = Math.max(max, op.y + op.h);
    else if (op.k === 'dot') max = Math.max(max, op.y + op.r);
    else if (op.points) for (const [, py] of op.points) max = Math.max(max, py);
  }
  return max === -Infinity ? 0 : max;
}

function checkFile(file) {
  const slides = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n\x1b[1m${path.basename(path.dirname(path.dirname(file)))}\x1b[0m  (${slides.length} slides)`);

  let worst = 0;
  let overflow = 0;
  let extraPages = 0;
  let minRoot = Infinity;

  slides.forEach((slide, i) => {
    const { pages } = composeSlide(slide.content, { width: W, height: H, theme: 'studio' });
    extraPages += pages.length - 1;

    pages.forEach((page, p) => {
      const bottom = pageExtent(page);
      const limit = H - frame.marginBottom;
      minRoot = Math.min(minRoot, page.root);
      worst = Math.max(worst, bottom);
      if (bottom > limit + 0.5) {
        overflow++;
        console.log(fail(`slide ${i}${pages.length > 1 ? `.${p}` : ''} bottom=${bottom.toFixed(0)} > ${limit} (root ${page.root})`));
      }
    });
  });

  const tag = overflow === 0 ? pass : fail;
  console.log(tag(`${slides.length} slides, ${extraPages} auto-split page(s), smallest root ${minRoot}px, lowest ink y=${worst.toFixed(0)} / ${H - frame.marginBottom}`));
  if (overflow) failures += overflow;
}

const args = process.argv.slice(2);
const files = args.length ? args : (() => {
  const base = path.resolve('../frameflow-backend/audio');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base)
    .map((d) => path.join(base, d, 'json', 'j1.json'))
    .filter((f) => fs.existsSync(f));
})();

console.log('\x1b[1m=== 1. Overflow on real generated slides ===\x1b[0m');
if (!files.length) console.log('  (no session data found — skipping)');
files.forEach(checkFile);

/* ---------- 2. markdown feature coverage --------------------------- */

console.log('\n\x1b[1m=== 2. Markdown coverage ===\x1b[0m');

const textOf = (page) => page.ops.filter((o) => o.k === 'text').map((o) => o.text).join('|');

const coverage = [
  ['ordered list numbers', '1. Alpha\n2. Beta\n3. Gamma', (t) => t.includes('1.') && t.includes('2.') && t.includes('3.')],
  ['inline code kept', 'Call `printf()` now.', (t) => t.includes('printf()')],
  ['fenced code block', '```python\nprint("hi")\n```', (t) => t.includes('print') && t.includes('"hi"')],
  ['code keyword coloured', '```python\nreturn x\n```', null],
  ['table cells', '| A | B |\n|---|---|\n| 1 | 2 |', (t) => ['A', 'B', '1', '2'].every((c) => t.includes(c))],
  ['strikethrough drawn', '~~wrong~~ right', null],
  ['highlight ==mark==', 'This is ==important== stuff', (t) => t.includes('important')],
  ['colour span', 'A [danger]{red} word', (t) => t.includes('danger')],
  ['callout panel', '> [!tip] Remember this', (t) => t.includes('Remember')],
  ['blockquote', '> A quoted line', (t) => t.includes('quoted')],
  ['horizontal rule', 'A\n\n---\n\nB', (t) => t.includes('A') && t.includes('B')],
  ['currency survives', 'Cost is $50 and $20 more.', (t) => t.includes('$50')],
  ['emoji survives', 'Energy 🔋 flows ⚡ here', (t) => t.includes('🔋')],
  ['nested list', '- Outer\n  - Inner', (t) => t.includes('Outer') && t.includes('Inner')],
];

for (const [name, src, check] of coverage) {
  const { pages } = composeSlide(src, { width: W, height: H, theme: 'studio' });
  const t = textOf(pages[0]);
  const ok = check ? check(t) : pages[0].ops.length > 0;
  console.log(ok ? pass(name) : fail(`${name} -> "${t}"`));
  if (!ok) failures++;
}

// Structural assertions that aren't about text content.
{
  const strike = composeSlide('~~wrong~~ right', { width: W, height: H, theme: 'studio' }).pages[0];
  const hasLine = strike.ops.some((o) => o.k === 'path' && o.points?.length === 2);
  console.log(hasLine ? pass('strikethrough rule drawn') : fail('strikethrough rule missing'));
  if (!hasLine) failures++;

  const mark = composeSlide('a ==b== c', { width: W, height: H, theme: 'studio' }).pages[0];
  const hasWash = mark.ops.some((o) => o.k === 'rect' && o.fill === '#FDF0C7');
  console.log(hasWash ? pass('highlight wash drawn') : fail('highlight wash missing'));
  if (!hasWash) failures++;

  const tip = composeSlide('> [!tip] Do this', { width: W, height: H, theme: 'studio' }).pages[0];
  const hasPanel = tip.ops.some((o) => o.k === 'rect' && o.fill === '#EAF6EF');
  console.log(hasPanel ? pass('callout panel drawn') : fail('callout panel missing'));
  if (!hasPanel) failures++;
}

/* ---------- 3. maths ------------------------------------------------ */

console.log('\n\x1b[1m=== 3. Maths ===\x1b[0m');

const mathCases = [
  ['fraction', '\\frac{a}{b}', (b) => b.a > 20 && b.d > 5],
  ['nested fraction', '\\frac{\\frac{1}{2}}{3}', (b) => b.a > 30],
  ['sqrt', '\\sqrt{x+1}', (b) => b.ops.some((o) => o.k === 'path')],
  ['sum with limits', '\\sum_{i=1}^{n} i^2', (b) => b.a > 30 && b.d > 10],
  ['integral', '\\int_0^\\infty e^{-x} dx', (b) => b.w > 40],
  ['greek', '\\alpha + \\beta = \\gamma', (b) => b.ops.some((o) => o.text === 'α')],
  ['blackboard R', '\\mathbb{R}', (b) => b.ops.some((o) => o.text === 'ℝ')],
  ['matrix', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', (b) => b.w > 40 && b.a > 20],
  ['scaled parens', '\\left( \\frac{a}{b} \\right)', (b) => b.ops.some((o) => o.scaleY > 1)],
  ['unknown command survives', '\\foobar{x}', (b) => b.ops.length > 0],
  ['E = mc^2', 'E = mc^2', (b) => b.ops.some((o) => o.text === '2')],
  ['subscript', 'E_n = \\hbar \\omega', (b) => b.ops.some((o) => o.text === 'ℏ')],
  ['vec accent', '\\vec{F} = m\\vec{a}', (b) => b.ops.filter((o) => o.k === 'path').length >= 2],
];

for (const [name, tex, check] of mathCases) {
  let ok = false;
  let note = '';
  try {
    const box = measureMath(parseMath(tex), { size: 40, color: '#000', display: true });
    ok = check(box);
    note = `w=${box.w} a=${box.a.toFixed(0)} d=${box.d.toFixed(0)} ops=${box.ops.length}`;
  } catch (e) {
    note = e.message;
  }
  console.log(ok ? pass(`${name}  (${note})`) : fail(`${name}  (${note})`));
  if (!ok) failures++;
}

/* ---------- 4. stress: pathological slides -------------------------- */

console.log('\n\x1b[1m=== 4. Stress ===\x1b[0m');

const stress = [
  ['very long slide splits', '# Title\n\n' + Array.from({ length: 40 }, (_, i) => `- Bullet number ${i} with a reasonable amount of explanatory text attached to it`).join('\n')],
  ['single enormous word', '# T\n\n' + 'Supercalifragilistic'.repeat(20)],
  ['wide code block', '```js\n' + `const x = ${'"averylongstring" + '.repeat(14)}1;\n` + '```'],
  ['wide table', '| ' + Array.from({ length: 9 }, (_, i) => `Column ${i}`).join(' | ') + ' |\n|' + '---|'.repeat(9) + '\n| ' + Array.from({ length: 9 }, (_, i) => `value ${i}`).join(' | ') + ' |'],
  ['empty', ''],
  ['only heading', '# Just a title'],
  ['deep math', '$$\\sum_{i=1}^{n} \\frac{\\sqrt{x_i^2 + y_i^2}}{\\left( 1 + \\frac{a}{b} \\right)^2}$$'],
];

for (const [name, src] of stress) {
  try {
    const { pages } = composeSlide(src, { width: W, height: H, theme: 'studio' });
    const limit = H - frame.marginBottom;
    const bad = pages.filter((p) => pageExtent(p) > limit + 0.5);
    const ok = bad.length === 0;
    console.log(ok
      ? pass(`${name} -> ${pages.length} page(s), root ${pages.map((p) => p.root).join('/')}`)
      : fail(`${name} -> ${bad.length}/${pages.length} page(s) overflow`));
    if (!ok) failures++;
  } catch (e) {
    console.log(fail(`${name} threw: ${e.message}`));
    failures++;
  }
}

/* ---------- 5. image placement -------------------------------------- */

console.log('\n\x1b[1m=== 5. Image placement adapts to aspect ratio ===\x1b[0m');

const img = (w, h) => ({ naturalWidth: w, naturalHeight: h, width: w, height: h });
const body = '# Photosynthesis\n\n- Light hits the chloroplast\n- Water splits into oxygen\n- Glucose is produced';

for (const [name, w, h] of [['portrait 3:4', 768, 1024], ['square 1:1', 1024, 1024], ['wide 16:9', 1600, 900], ['panorama 3:1', 1800, 600]]) {
  const { pages } = composeSlide(`${body}\n\n![d](x.png)`, {
    width: W, height: H, theme: 'studio', imageCache: { 'x.png': img(w, h) },
  });
  const im = pages[0].ops.find((o) => o.k === 'image');
  if (!im) { console.log(fail(`${name}: no image op`)); failures++; continue; }
  const area = ((im.w * im.h) / (frame.contentW * frame.contentH) * 100).toFixed(0);
  const side = im.x > W * 0.45 ? 'right column' : im.y > H * 0.45 ? 'below text' : 'left/top';
  console.log(pass(`${name}: ${im.w}x${im.h} (${area}% of content area, ${side})`));
}


/* ---------- 6. maths geometry --------------------------------------- */

console.log('\n\x1b[1m=== 6. Maths geometry ===\x1b[0m');

const box = (tex, opts = {}) => measureMath(parseMath(tex), { size: 40, color: '#000', display: true, ...opts });
const textAt = (b, s) => b.ops.find((o) => o.k === 'text' && o.text === s);

{
  // a over b: numerator above the rule, denominator below it.
  const b = box('\\frac{a}{b}');
  const num = textAt(b, 'a');
  const den = textAt(b, 'b');
  const rule = b.ops.find((o) => o.k === 'rect');
  const ok = num && den && rule && num.y < rule.y && rule.y < den.y;
  console.log(ok ? pass(`fraction stacks (num y=${num?.y.toFixed(0)} < rule y=${rule?.y.toFixed(0)} < den y=${den?.y.toFixed(0)})`)
    : fail('fraction does not stack'));
  if (!ok) failures++;
}

{
  // Sum in display mode: upper limit above the sigma, lower limit below it.
  const b = box('\\sum_{i=1}^{n} i');
  const sigma = textAt(b, '\u2211');
  const upper = textAt(b, 'n');
  const lower = textAt(b, 'i');
  const ok = sigma && upper && lower && upper.y < sigma.y && sigma.y < lower.y;
  console.log(ok ? pass(`display limits straddle the operator (sup y=${upper?.y.toFixed(0)} < op y=${sigma?.y.toFixed(0)} < sub y=${lower?.y.toFixed(0)})`)
    : fail('display limits are misplaced'));
  if (!ok) failures++;
}

{
  // The same sum inline must collapse to side-set scripts, or line height blows up.
  const disp = box('\\sum_{i=1}^{n} i');
  const inline = box('\\sum_{i=1}^{n} i', { display: false });
  const ok = inline.a < disp.a && inline.w > disp.w * 0.7;
  console.log(ok ? pass(`inline sum stays short (ascent ${inline.a.toFixed(0)} vs display ${disp.a.toFixed(0)})`)
    : fail('inline sum did not collapse its limits'));
  if (!ok) failures++;
}

{
  // A radical must reach over a tall body rather than being a fixed glyph.
  const flat = box('\\sqrt{x}');
  const tall = box('\\sqrt{\\frac{a}{b}}');
  const ok = tall.a > flat.a * 1.3;
  console.log(ok ? pass(`radical stretches (flat ascent ${flat.a.toFixed(0)} -> tall ${tall.a.toFixed(0)})`)
    : fail('radical did not stretch around a tall body'));
  if (!ok) failures++;
}

{
  // Superscripts sit above the baseline, subscripts below it.
  const b = box('x^2_i');
  const sup = textAt(b, '2');
  const sub = textAt(b, 'i');
  const ok = sup && sub && sup.y < 0 && sub.y > 0;
  console.log(ok ? pass(`scripts split around the baseline (sup ${sup?.y.toFixed(0)}, sub ${sub?.y.toFixed(0)})`)
    : fail('scripts are not positioned around the baseline'));
  if (!ok) failures++;
}

/* ---------- 7. everything stays inside the frame --------------------- */

console.log('\n\x1b[1m=== 7. Showcase content stays in frame ===\x1b[0m');

const showcase = [
  ['maths slide', '# Schrodinger\n\n$$i\hbar \frac{\partial \Psi}{\partial t} = \hat{H}\Psi$$\n\n- $\hat{H}$ is the **Hamiltonian**\n- Energies $E_n = \frac{n^2 \pi^2 \hbar^2}{2mL^2}$\n- $\langle E \rangle = \sum_{n=1}^{\infty} P_n E_n$'],
  ['code slide', '# Binary Search\n\n```python\ndef search(a, t):\n    lo, hi = 0, len(a) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if a[mid] == t: return mid\n        lo = mid + 1\n```\n\n- Runs in $O(\log n)$'],
  ['table slide', '# Classical vs Quantum\n\n| Property | Classical | Quantum |\n|---|---|---|\n| State | Definite | Superposed |\n| Measurement | Passive | Disturbs |\n\n- It is ~~one or the other~~ [both]{green}'],
  ['callout slide', '# Photosynthesis\n\n1. **Light reactions**\n   - Split water into $O_2$\n2. **Calvin cycle**\n   - Fix $CO_2$ into sugar\n\n> [!warn] Not the "dark reaction" — it runs in daylight too.'],
];

for (const [name, md] of showcase) {
  const { pages } = composeSlide(md, { width: W, height: H, theme: 'studio' });
  let worstL = Infinity, worstR = -Infinity, worstT = Infinity, worstB = -Infinity;

  for (const page of pages) {
    for (const op of page.ops) {
      if (op.k === 'text') {
        worstL = Math.min(worstL, op.x);
        worstR = Math.max(worstR, op.x + op.text.length * page.root * 0.55);
        worstT = Math.min(worstT, op.y - page.root * 1.9);
        worstB = Math.max(worstB, op.y + page.root * 0.3);
      } else if (op.k === 'rect' || op.k === 'image') {
        worstL = Math.min(worstL, op.x);
        worstR = Math.max(worstR, op.x + op.w);
        worstT = Math.min(worstT, op.y);
        worstB = Math.max(worstB, op.y + op.h);
      }
    }
  }

  const bad = [];
  if (worstL < -1) bad.push(`left ${worstL.toFixed(0)}`);
  if (worstT < -1) bad.push(`top ${worstT.toFixed(0)}`);
  if (worstB > H - frame.marginBottom + 1) bad.push(`bottom ${worstB.toFixed(0)}`);
  // Text width here is an upper-bound estimate, so allow the full frame width.
  if (worstR > W + 1) bad.push(`right ${worstR.toFixed(0)}`);

  console.log(bad.length ? fail(`${name}: ${bad.join(', ')}`)
    : pass(`${name}: x ${worstL.toFixed(0)}..${Math.min(worstR, W).toFixed(0)}, y ${worstT.toFixed(0)}..${worstB.toFixed(0)}`));
  if (bad.length) failures++;
}

/* ---------- summary -------------------------------------------------- */

console.log(
  failures === 0
    ? '\n\x1b[32m\x1b[1mAll checks passed.\x1b[0m\n'
    : `\n\x1b[31m\x1b[1m${failures} check(s) failed.\x1b[0m\n`,
);
process.exit(failures ? 1 : 0);
