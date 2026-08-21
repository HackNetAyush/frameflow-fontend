/**
 * Work out the real content budget for a slide, so the LLM prompt can quote
 * numbers derived from the renderer instead of guessed ones.
 *
 *   node scripts/calibrate-budget.mjs
 */

const CHAR_W = { mono: 0.601, math: 0.5, display: 0.545, body: 0.517 };
const EMOJI = /\p{Extended_Pictographic}/u;

const familyKey = (f) =>
  /JetBrains Mono|monospace/.test(f) ? 'mono'
    : /STIX|Cambria Math|serif/.test(f) ? 'math'
      : /Plus Jakarta/.test(f) ? 'display' : 'body';

const makeContext = () => {
  let font = '16px sans-serif';
  return {
    set font(v) { font = v; }, get font() { return font; },
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
};

globalThis.document = {
  createElement: () => ({ width: 0, height: 0, getContext: () => makeContext() }),
  fonts: { load: () => Promise.resolve(), ready: Promise.resolve() },
};

const { composeSlide } = await import('../src/render/slide.js');
const { frameMetrics } = await import('../src/render/theme.js');

const W = 1920;
const H = 1080;
const f = frameMetrics(W, H);
const MAX_ROOT = Math.round(H * 0.038);

console.log(`frame        ${W} x ${H}`);
console.log(`content box  ${f.contentW} x ${f.contentH}  (margins ${f.marginX} / ${f.marginTop} / ${f.marginBottom})`);
console.log(`root sizes   ${MAX_ROOT}px max -> ${Math.round(H * 0.0205)}px floor`);

// Characters per line at the largest size.
const bodyCharW = CHAR_W.body * MAX_ROOT;
console.log(`chars/line   ~${Math.floor(f.contentW / bodyCharW)} at ${MAX_ROOT}px full width`);
console.log(`body lines   ~${Math.floor(f.contentH / (MAX_ROOT * 1.45))} at ${MAX_ROOT}px\n`);

const WORD = 'concept ';
const bullet = (chars) => `- ${WORD.repeat(Math.ceil(chars / WORD.length)).slice(0, chars).trim()}`;

const probe = (label, md) => {
  const { pages } = composeSlide(md, { width: W, height: H, theme: 'studio' });
  const boardChars = md.length;
  const flag = pages.length > 1 ? 'SPLIT' : pages[0].root === MAX_ROOT ? 'max ' : '    ';
  console.log(
    `  ${flag}  ${String(boardChars).padStart(4)} chars  ->  root ${String(pages[0].root).padStart(2)}px, ${pages.length} page(s)   ${label}`,
  );
  return pages;
};

console.log('Title + N bullets of ~62 chars each:');
for (let n = 3; n <= 10; n++) {
  probe(`${n} bullets`, `# A Reasonably Typical Slide Title\n\n${Array.from({ length: n }, () => bullet(62)).join('\n')}`);
}

console.log('\nTitle + 5 bullets of varying length:');
for (const len of [40, 60, 80, 110, 150, 200]) {
  probe(`5 x ${len} chars`, `# A Reasonably Typical Slide Title\n\n${Array.from({ length: 5 }, () => bullet(len)).join('\n')}`);
}

console.log('\nWith a sub-heading and a callout:');
probe('h1 + 4 bullets + h2 + 2 bullets',
  '# Main Concept Here\n\n- First supporting point about the idea\n- Second supporting point about the idea\n- Third supporting point about the idea\n- Fourth supporting point here\n\n## Key formulas\n\n- $E = mc^2$ describes mass energy\n- $F = ma$ describes force');
probe('h1 + 4 bullets + callout',
  '# Main Concept Here\n\n- First supporting point about the idea\n- Second supporting point about the idea\n- Third supporting point about the idea\n\n> [!key] Energy is always quantised in discrete packets.');
probe('h1 + display math + 3 bullets',
  '# Schrodinger Equation\n\n$$i\\hbar \\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$\n\n- Describes how a quantum state evolves\n- The Hamiltonian encodes total energy\n- Solutions give allowed energy levels');
probe('h1 + code block (8 lines)',
  '# Binary Search\n\n```python\ndef search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        lo = mid + 1\n```');
probe('h1 + table (4 rows)',
  '# Comparison\n\n| Property | Classical | Quantum |\n|---|---|---|\n| State | Definite | Superposed |\n| Measurement | Passive | Disturbs |\n| Evolution | Newton | Schrodinger |');

console.log('\nWith an image (square 1024, side column):');
const img = { naturalWidth: 1024, naturalHeight: 1024, width: 1024, height: 1024 };
for (let n = 2; n <= 7; n++) {
  const md = `# Slide With A Diagram\n\n${Array.from({ length: n }, () => bullet(52)).join('\n')}\n\n![d](x.png)`;
  const { pages } = composeSlide(md, { width: W, height: H, theme: 'studio', imageCache: { 'x.png': img } });
  const im = pages[0].ops.find((o) => o.k === 'image');
  console.log(`  ${pages[0].root === MAX_ROOT ? 'max ' : '    '}  ${String(md.length).padStart(4)} chars  ->  root ${String(pages[0].root).padStart(2)}px, image ${im ? `${im.w}x${im.h}` : 'none'}   ${n} bullets`);
}
