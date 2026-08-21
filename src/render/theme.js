/**
 * Slide design tokens.
 *
 * This is the single source of truth for how a rendered slide looks. The old
 * renderer had colours hardcoded in three places that disagreed with each other
 * (white in the renderer, dark slate in the gap-filler frame, "light" in the
 * image prompt); everything now reads from here instead.
 */

const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color"';

/**
 * Canvas `font` strings need the emoji families in the stack or emoji render as
 * tofu. Every family below ends with the emoji fallback for that reason.
 */
export const FONTS = {
  display: `"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif, ${EMOJI}`,
  body: `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif, ${EMOJI}`,
  mono: `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace, ${EMOJI}`,
  math: `"STIX Two Text", "Cambria Math", "Times New Roman", Times, serif, ${EMOJI}`,
};

/** Families we must wait on before the first measurement, or metrics lie. */
export const WEBFONTS = [
  '400 16px "Inter"', '500 16px "Inter"', '600 16px "Inter"', '700 16px "Inter"',
  'italic 400 16px "Inter"',
  '600 16px "Plus Jakarta Sans"', '700 16px "Plus Jakarta Sans"', '800 16px "Plus Jakarta Sans"',
  '400 16px "JetBrains Mono"', '700 16px "JetBrains Mono"',
  '400 16px "STIX Two Text"', 'italic 400 16px "STIX Two Text"', '700 16px "STIX Two Text"',
];

/**
 * Type scale. Sizes are multipliers against the fitted root size, so the whole
 * slide scales as one system when the fitter picks a smaller root — the old
 * additive heading formula (`root + (7 - level) * 8`) made headings relatively
 * *larger* on denser slides, which is backwards.
 */
export const SCALE = {
  h1: 1.86,
  h2: 1.42,
  h3: 1.16,
  h4: 1.0,
  body: 1.0,
  code: 0.86,
  table: 0.92,
  caption: 0.78,
  lead: 1.12,
};

/** Vertical rhythm, also expressed as multiples of the root size. */
export const RHYTHM = {
  lineHeight: 1.45,
  headingLineHeight: 1.16,
  codeLineHeight: 1.5,
  paraGap: 0.72,
  listGap: 0.34,
  blockGap: 0.86,
  headingGapBefore: 1.05,
  headingGapAfter: 0.42,
  listIndent: 1.32,
  markerGap: 0.52,
};

const studio = {
  name: 'studio',
  isDark: false,
  bg: '#FBFCFD',
  bgTint: '#F1F5F8',
  ink: '#0F151D',
  inkSoft: '#46536A',
  inkFaint: '#7A879B',
  rule: '#DCE3EB',
  ruleSoft: '#EAEFF4',

  accent: '#0E6E8C',
  accentInk: '#0B5A73',
  accentWash: '#E3F1F6',

  markBg: '#FDF0C7',
  markInk: '#5C4405',

  codeBg: '#F4F7FA',
  codeBorder: '#DDE5ED',
  codeInk: '#1C2733',
  codeGutter: '#9AA9BA',

  quoteBg: '#F3F7FA',
  quoteBar: '#0E6E8C',

  tableHeadBg: '#EFF4F8',
  tableZebra: '#F8FAFC',

  shadow: 'rgba(15, 32, 56, 0.10)',
  imageFrame: '#E4EAF1',

  syntax: {
    keyword: '#9B2673',
    string: '#0A6B4A',
    number: '#A2540A',
    comment: '#8593A6',
    fn: '#215FA6',
    punct: '#5A6B80',
    type: '#7038A8',
  },

  swatch: {
    red: '#C0362C', green: '#1B7A4B', blue: '#1F5FAE', amber: '#96620A',
    violet: '#6D3BB0', teal: '#0E6E8C', pink: '#B02D77', muted: '#7A879B',
  },

  callout: {
    note: { bg: '#EFF4F9', bar: '#4A7DB0', ink: '#22415F', icon: 'ℹ' },
    tip: { bg: '#EAF6EF', bar: '#1B7A4B', ink: '#145635', icon: '✔' },
    warn: { bg: '#FDF3E3', bar: '#B87A12', ink: '#6E4708', icon: '⚠' },
    key: { bg: '#E3F1F6', bar: '#0E6E8C', ink: '#0B4A5F', icon: '★' },
    example: { bg: '#F3EFFA', bar: '#6D3BB0', ink: '#472574', icon: '❖' },
  },
};

const midnight = {
  name: 'midnight',
  isDark: true,
  bg: '#0C1016',
  bgTint: '#141B24',
  ink: '#E9EEF5',
  inkSoft: '#9DAABC',
  inkFaint: '#6C7B90',
  rule: '#243040',
  ruleSoft: '#1A2330',

  accent: '#4FC3DC',
  accentInk: '#7FD6E8',
  accentWash: '#11313C',

  markBg: '#4A3B10',
  markInk: '#FFE08A',

  codeBg: '#121A24',
  codeBorder: '#233040',
  codeInk: '#DCE6F2',
  codeGutter: '#5A6B80',

  quoteBg: '#121A24',
  quoteBar: '#4FC3DC',

  tableHeadBg: '#18222E',
  tableZebra: '#111923',

  shadow: 'rgba(0, 0, 0, 0.45)',
  imageFrame: '#243040',

  syntax: {
    keyword: '#F08FC8', string: '#7FD9AC', number: '#F5B476', comment: '#66788E',
    fn: '#7FB8F5', punct: '#93A4B8', type: '#C3A0F0',
  },

  swatch: {
    red: '#F58A80', green: '#6FD79E', blue: '#7FB8F5', amber: '#EDB55C',
    violet: '#C3A0F0', teal: '#4FC3DC', pink: '#F58AC0', muted: '#8B9AAE',
  },

  callout: {
    note: { bg: '#14202C', bar: '#5B93C9', ink: '#BBD3EA', icon: 'ℹ' },
    tip: { bg: '#12251C', bar: '#3FA36B', ink: '#A9E3C4', icon: '✔' },
    warn: { bg: '#271D0F', bar: '#D69A2E', ink: '#F0CE8E', icon: '⚠' },
    key: { bg: '#11313C', bar: '#4FC3DC', ink: '#A8E2F0', icon: '★' },
    example: { bg: '#1F1830', bar: '#9B78D8', ink: '#D3BEF5', icon: '❖' },
  },
};

export const THEMES = { studio, midnight };

export const getTheme = (name) => THEMES[name] || studio;

/**
 * Frame geometry. Margins are proportional so 9:16 and 1:1 presets work without
 * a second set of constants.
 */
export const PRESETS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
};

export const frameMetrics = (width, height) => {
  const marginX = Math.round(width * 0.065);
  const marginTop = Math.round(height * 0.085);
  const footer = Math.round(height * 0.062);
  return {
    marginX,
    marginTop,
    marginBottom: footer,
    contentX: marginX,
    contentY: marginTop,
    contentW: width - marginX * 2,
    contentH: height - marginTop - footer,
    footerY: height - footer,
  };
};
