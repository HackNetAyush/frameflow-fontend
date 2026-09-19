/**
 * Colour maths for user-chosen accents.
 *
 * The renderer's two themes ship with accents picked by hand against their own
 * backgrounds. Once the accent is the user's choice that guarantee is gone: a
 * deep indigo is invisible on Midnight and a pale mint is invisible on Studio,
 * and the accent is not decoration — it draws the progress bar, the callout
 * rules and the quote bars, and it is offered to the image model as a linework
 * colour. So every accent is nudged until it actually reads, rather than being
 * taken literally and rendered unusable.
 *
 * This is the only implementation. The value sent to the backend is the
 * adjusted one, so the slide and the artwork drawn for it use the same colour.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const parseHex = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const toHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

export const isHex = (value) => parseHex(value) !== null;

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const luminance = (hex) => {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const isDark = (hex) => luminance(hex) < 0.4;

/** Blend two colours. `amount` is how much of `a` survives. */
export const mix = (a, b, amount) => {
  const [ra, ga, ba] = parseHex(a) || [0, 0, 0];
  const [rb, gb, bb] = parseHex(b) || [0, 0, 0];
  const t = clamp(amount, 0, 1);
  return toHex([ra * t + rb * (1 - t), ga * t + gb * (1 - t), ba * t + bb * (1 - t)]);
};

/**
 * Push a colour towards white or black, whichever is away from `bg`.
 *
 * Mixing towards the extreme rather than scaling the channels keeps the hue:
 * halving an RGB triple to darken it also desaturates it, and a lime that
 * arrives as olive is not the colour the user picked out of the swatch row.
 */
const shiftAwayFrom = (hex, bg, amount) => mix(isDark(bg) ? '#FFFFFF' : '#000000', hex, amount);

/**
 * The nearest version of `hex` that clears `ratio` against `bg`.
 *
 * 3:1 is the WCAG threshold for graphics and large text, which is what an
 * accent is used for here — never body copy, so the stricter 4.5:1 would
 * flatten the palette for no benefit. Returns the input untouched when it
 * already passes, which every built-in preset does on both themes.
 */
export const ensureReadable = (hex, bg, ratio = 3) => {
  if (!isHex(hex) || !isHex(bg)) return hex;
  if (contrast(hex, bg) >= ratio) return hex;

  // Walk in small steps and stop at the first pass, so a colour that needs a
  // nudge gets a nudge and not a wash-out.
  for (let amount = 0.06; amount <= 1; amount += 0.06) {
    const candidate = shiftAwayFrom(hex, bg, amount);
    if (contrast(candidate, bg) >= ratio) return candidate;
  }
  // Nothing in the ramp cleared it, which only happens for a mid-grey against
  // a mid-grey board. The far extreme is the best available answer.
  return isDark(bg) ? '#FFFFFF' : '#000000';
};

/**
 * Derive the full set of accent tokens a theme needs from one colour.
 *
 * `ink` is the step used for text and icons: pushed further from the board
 * than the fill, because a colour legible as a 6px rule is not automatically
 * legible as a letterform. `wash` is the tinted panel behind a callout — a
 * mix with the board rather than an alpha, since slide ops are painted onto an
 * opaque canvas and a translucent fill would composite differently depending
 * on what it landed over.
 */
export const accentRamp = (accent, bg) => {
  const base = ensureReadable(accent, bg);
  return {
    accent: base,
    accentInk: ensureReadable(shiftAwayFrom(base, bg, 0.22), bg, 4.5),
    accentWash: mix(base, bg, isDark(bg) ? 0.16 : 0.14),
  };
};
