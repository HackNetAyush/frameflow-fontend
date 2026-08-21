/**
 * Render slides to a standalone HTML page of SVG previews.
 *
 * Paint ops are already resolved geometry, so they map almost one-to-one onto
 * SVG elements. That gives a way to eyeball real layout — type sizes, wrapping,
 * maths, image placement — without running a generation or opening the app.
 *
 *   node scripts/preview.mjs                          # built-in showcase
 *   node scripts/preview.mjs ../frameflow-backend/audio/<id>/json/j1.json
 *   node scripts/preview.mjs --theme midnight
 *
 * Writes preview.html next to the project root; open it in a browser.
 */

import fs from 'node:fs';
import path from 'node:path';

/* ---------- metric stub -------------------------------------------- */

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
const { getTheme } = await import('../src/render/theme.js');

/* ---------- ops -> SVG ---------------------------------------------- */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Split a canvas font shorthand into SVG text attributes. */
function fontAttrs(font) {
  const italic = /^italic/.test(font);
  const size = parseFloat(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] || '16');
  const weight = /(\d{3})\s+\d/.exec(font)?.[1] || '400';
  const family = font.slice(font.indexOf('px ') + 3);
  return `font-family="${esc(family)}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}`;
}

function opToSvg(op) {
  switch (op.k) {
    case 'text': {
      const attrs = `${fontAttrs(op.font)} fill="${op.fill}" xml:space="preserve"`;
      if (op.scaleY && op.scaleY !== 1) {
        const oy = op.originY ?? op.y;
        return `<g transform="translate(${op.x} ${oy}) scale(${op.scaleX || 1} ${op.scaleY})"><text x="0" y="${(op.y - oy) / op.scaleY}" ${attrs}>${esc(op.text)}</text></g>`;
      }
      return `<text x="${op.x}" y="${op.y}" ${attrs}>${esc(op.text)}</text>`;
    }
    case 'rect':
      return `<rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}"${op.r ? ` rx="${op.r}"` : ''} fill="${op.fill || 'none'}"${op.stroke ? ` stroke="${op.stroke}" stroke-width="${op.lw || 1}"` : ''}/>`;
    case 'dot':
      return `<circle cx="${op.x}" cy="${op.y}" r="${op.r}" fill="${op.fill || 'none'}"${op.stroke ? ` stroke="${op.stroke}" stroke-width="${op.lw || 1}"` : ''}/>`;
    case 'path':
      return `<polyline points="${op.points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${op.fill || 'none'}"${op.stroke ? ` stroke="${op.stroke}" stroke-width="${op.lw || 1}"` : ''} stroke-linecap="${op.cap || 'butt'}" stroke-linejoin="${op.join || 'miter'}"/>`;
    case 'curve':
      return `<path d="M ${op.x} ${op.y} Q ${op.cx} ${op.cy} ${op.ex} ${op.ey}" fill="none" stroke="${op.stroke}" stroke-width="${op.lw || 1}"/>`;
    case 'image':
      return `<g><rect x="${op.x}" y="${op.y}" width="${op.w}" height="${op.h}" rx="${op.r || 0}" fill="#00000010" stroke="${op.stroke || '#ccc'}" stroke-dasharray="8 6"/><text x="${op.x + op.w / 2}" y="${op.y + op.h / 2}" text-anchor="middle" font-family="monospace" font-size="22" fill="#8894a5">image ${op.w}x${op.h}</text></g>`;
    default:
      return '';
  }
}

/* ---------- build ---------------------------------------------------- */

const argv = process.argv.slice(2);
const themeName = (() => {
  const i = argv.indexOf('--theme');
  return i >= 0 ? argv[i + 1] : 'studio';
})();
const files = argv.filter((a) => !a.startsWith('--') && a !== themeName);

const W = 1920;
const H = 1080;
const theme = getTheme(themeName);

const SHOWCASE = [
  {
    label: 'Maths — display equation, inline maths, callout',
    md: `# Why Light Bends in Water

- Light slows entering a ==denser medium==
- The speed change **bends** the ray at the boundary
- Ratio of speeds is the *refractive index* $n$

$$n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$$

> [!key] Bigger $n$ means slower light and a sharper bend.`,
  },
  {
    label: 'Heavier maths — fractions, limits, matrices',
    md: `# The Schrödinger Equation

$$i\\hbar \\frac{\\partial \\Psi}{\\partial t} = \\hat{H}\\Psi$$

- $\\hat{H}$ is the **Hamiltonian** — total energy of the system
- Solutions give the allowed energies $E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2mL^2}$
- Probability comes from $|\\Psi|^2$, never from $\\Psi$ itself

$$\\langle E \\rangle = \\sum_{n=1}^{\\infty} P_n E_n$$`,
  },
  {
    label: 'Code — syntax highlighting and line numbers',
    md: `# Binary Search in Python

\`\`\`python
def search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
\`\`\`

- Halves the search space each step — $O(\\log n)$`,
  },
  {
    label: 'Table + colour spans + strikethrough',
    md: `# Classical vs Quantum

| Property | Classical | Quantum |
|---|---|---|
| State | Definite | Superposed |
| Measurement | Passive | Disturbs the system |
| Evolution | Newton's laws | Schrödinger equation |

- It is ~~a wave or a particle~~ [both at once]{green}
- Never [purely deterministic]{red} at small scales`,
  },
  {
    label: 'Callouts, nested lists, emoji',
    md: `# Photosynthesis ⚡

1. **Light reactions** in the thylakoid
   - Split water into $O_2$, $H^+$ and electrons
   - Build $ATP$ and $NADPH$
2. **Calvin cycle** in the stroma
   - Fix $CO_2$ into sugar

> [!warn] The Calvin cycle is *not* the "dark reaction" — it runs in daylight too.`,
  },
  {
    label: 'Image slide — placement chosen by measurement',
    md: `# Structure of a Chloroplast 🌍

- Outer and inner **membranes** enclose the stroma
- ==Thylakoid stacks== are where light is captured
- Chlorophyll sits inside the thylakoid membrane

![diagram](demo.png)`,
    images: { 'demo.png': { naturalWidth: 1024, naturalHeight: 1024, width: 1024, height: 1024 } },
  },
];

const slides = files.length
  ? JSON.parse(fs.readFileSync(files[0], 'utf8')).map((s, i) => ({ label: `Slide ${i + 1}`, md: s.content }))
  : SHOWCASE;

const cards = [];

slides.forEach((slide) => {
  const { pages } = composeSlide(slide.md, {
    width: W, height: H, theme: themeName, imageCache: slide.images || {},
  });

  pages.forEach((page, p) => {
    const body = page.ops.map(opToSvg).join('\n      ');
    const label = pages.length > 1 ? `${slide.label} — page ${p + 1}/${pages.length}` : slide.label;
    cards.push(`
  <figure>
    <figcaption><span>${esc(label)}</span><code>root ${page.root}px · ${page.ops.length} ops · ${page.bounds.length} blocks</code></figcaption>
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${W}" height="${H}" fill="${theme.bg}"/>
      ${body}
      <rect x="0" y="${H - 4}" width="${W * 0.4}" height="4" fill="${theme.accent}"/>
    </svg>
  </figure>`);
  });
});

const html = `<!doctype html>
<meta charset="utf-8">
<title>FrameFlow slide preview — ${esc(themeName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap">
<style>
  body { margin:0; padding:32px; background:#11151b; color:#e6ecf3;
         font:14px/1.5 "Inter",system-ui,sans-serif; }
  h1 { font:700 22px "Plus Jakarta Sans",sans-serif; margin:0 0 4px; }
  p.sub { color:#8fa0b4; margin:0 0 28px; }
  figure { margin:0 0 34px; }
  figcaption { display:flex; justify-content:space-between; align-items:baseline;
               gap:16px; margin-bottom:8px; color:#9db0c6; }
  figcaption span { font-weight:600; color:#e6ecf3; }
  figcaption code { font:400 12px "JetBrains Mono",monospace; color:#7d8fa5; }
  svg { width:100%; height:auto; display:block; border-radius:10px;
        box-shadow:0 12px 40px -16px rgba(0,0,0,.8); }
</style>
<h1>FrameFlow slide preview</h1>
<p class="sub">theme <b>${esc(themeName)}</b> &middot; ${cards.length} page(s) at ${W}&times;${H} &middot; geometry is exactly what the canvas renderer produces</p>
${cards.join('\n')}
`;

const out = path.resolve('preview.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out}  (${cards.length} page(s), theme "${themeName}")`);
