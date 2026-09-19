import { THEMES, DEFAULT_THEME } from '../render/theme.js';

/**
 * The studio controls, as the UI presents them.
 *
 * This file holds labels, hints and swatches. It holds no prompt text and no
 * rules about what a choice does — those live in the backend's
 * `src/prompts/options.js`, which is the contract, and which normalises
 * whatever arrives so an id this file gets wrong costs the look and not the
 * lesson.
 *
 * What the two files share is the set of ids below. Add one here and it must
 * exist there, or the server will silently substitute its default.
 *
 * `DEFAULTS` is not a fresh set of opinions: every value is what the app did
 * before any of this was configurable, so a user who never opens the panel
 * gets exactly the video they got before.
 */

export const DEFAULTS = {
  theme: DEFAULT_THEME,
  accent: null,
  artStyle: 'auto',
  imagery: 'balanced',
  background: 'board',
  backgroundColor: null,
  depth: 'balanced',
};

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */

/**
 * Swatches come from the renderer's own tokens rather than being retyped, so
 * the chip in the panel is painted with the literal colour the video will use.
 */
export const THEME_OPTIONS = [
  {
    id: 'midnight',
    label: 'Midnight',
    hint: 'Dark board, cool cyan accent. The default.',
    swatch: [THEMES.midnight.bg, THEMES.midnight.ink, THEMES.midnight.accent],
  },
  {
    id: 'studio',
    label: 'Studio',
    hint: 'Light board, deep teal accent. Reads well projected.',
    swatch: [THEMES.studio.bg, THEMES.studio.ink, THEMES.studio.accent],
  },
];

/* ------------------------------------------------------------------ *
 * Accent
 * ------------------------------------------------------------------ */

/**
 * Every preset is a mid-tone with room to move in both directions, because
 * `ensureReadable` adjusts it against whichever board it lands on. Picking
 * near-white or near-black here would leave nothing to adjust.
 */
export const ACCENT_PRESETS = [
  { id: null, label: 'Theme default' },
  { id: '#4FC3DC', label: 'Cyan' },
  { id: '#60A5FA', label: 'Blue' },
  { id: '#A78BFA', label: 'Violet' },
  { id: '#F472B6', label: 'Pink' },
  { id: '#FB7185', label: 'Coral' },
  { id: '#F59E0B', label: 'Amber' },
  { id: '#34D399', label: 'Green' },
  { id: '#B4F24A', label: 'Lime' },
];

/* ------------------------------------------------------------------ *
 * Art style
 * ------------------------------------------------------------------ */

export const ART_STYLE_OPTIONS = [
  { id: 'auto', label: 'Auto', hint: 'Let the model choose per slide' },
  { id: 'flat-vector', label: 'Flat vector', hint: 'Clean shapes, even linework' },
  { id: 'colorful', label: 'Colorful', hint: 'Bright, saturated, playful' },
  { id: 'creative', label: 'Creative', hint: 'Editorial visual metaphors' },
  { id: 'soft-3d', label: 'Soft 3D', hint: 'Rounded matte clay forms' },
  { id: 'isometric', label: 'Isometric', hint: 'Precise 30° technical views' },
  { id: 'chalkboard', label: 'Chalk', hint: 'Hand-drawn, best on Midnight' },
  { id: 'watercolor', label: 'Watercolour', hint: 'Soft translucent washes' },
  { id: 'neon', label: 'Neon', hint: 'Glowing strokes, best on Midnight' },
  { id: 'blueprint', label: 'Blueprint', hint: 'Drafted schematic linework' },
  { id: 'minimal', label: 'Minimal', hint: 'Single-weight line art, no fills' },
];

/* ------------------------------------------------------------------ *
 * How much artwork
 * ------------------------------------------------------------------ */

/**
 * `cost` is shown in the panel because this is the setting that actually moves
 * the clock: illustration is ~18s per slide against ~3s for narration, so the
 * choice between "none" and "lots" is a several-minute difference on a long
 * lesson, and that is worth knowing before pressing Generate rather than after.
 */
export const IMAGERY_OPTIONS = [
  { id: 'none', label: 'None', hint: 'Text only', cost: 'Fastest' },
  { id: 'sparing', label: 'Sparing', hint: 'About 1 slide in 5' },
  { id: 'balanced', label: 'Balanced', hint: 'About 1 slide in 3' },
  { id: 'rich', label: 'Lots', hint: 'About every other slide', cost: 'Slowest' },
];

/* ------------------------------------------------------------------ *
 * Lesson length
 * ------------------------------------------------------------------ */

export const DEPTH_OPTIONS = [
  { id: 'quick', label: 'Quick', hint: '4–6 slides' },
  { id: 'balanced', label: 'Balanced', hint: '8–14 slides' },
  { id: 'deep', label: 'In depth', hint: '16–24 slides' },
];

/* ------------------------------------------------------------------ *
 * Image background
 * ------------------------------------------------------------------ */

export const BACKGROUND_OPTIONS = [
  { id: 'board', label: 'Match slide', hint: 'Artwork is painted on the board colour' },
  { id: 'transparent', label: 'Transparent', hint: 'True cut-out — cleanest, but slower to generate' },
  { id: 'custom', label: 'Custom colour', hint: 'Paint artwork on a colour of your own' },
];

/** Starting points for a custom fill; the picker takes anything. */
export const BACKGROUND_PRESETS = [
  { id: '#FFFFFF', label: 'White' },
  { id: '#FFF7E6', label: 'Cream' },
  { id: '#EEF2F7', label: 'Mist' },
  { id: '#E8F0EA', label: 'Sage' },
  { id: '#1E293B', label: 'Slate' },
  { id: '#1C1917', label: 'Coffee' },
  { id: '#0F172A', label: 'Navy' },
  { id: '#000000', label: 'Black' },
];

/** Everything the panel can set, in the order the panel shows it. */
export const SECTIONS = [
  { key: 'theme', label: 'Video theme', options: THEME_OPTIONS },
  { key: 'artStyle', label: 'Illustration style', options: ART_STYLE_OPTIONS },
  { key: 'imagery', label: 'How many illustrations', options: IMAGERY_OPTIONS },
  { key: 'depth', label: 'Lesson length', options: DEPTH_OPTIONS },
  { key: 'background', label: 'Image background', options: BACKGROUND_OPTIONS },
];

const labelOf = (options, id) => options.find((o) => o.id === id)?.label;

/** The one-line summary shown on the collapsed panel. */
export const summarize = (options) => [
  labelOf(THEME_OPTIONS, options.theme),
  labelOf(ART_STYLE_OPTIONS, options.artStyle),
  `${labelOf(IMAGERY_OPTIONS, options.imagery)} visuals`,
  labelOf(DEPTH_OPTIONS, options.depth),
].filter(Boolean).join(' · ');

/** How many settings differ from the shipped defaults. */
export const changedCount = (options) =>
  Object.keys(DEFAULTS).filter((key) => {
    // A colour is only a change while the mode that uses it is selected.
    if (key === 'backgroundColor' && options.background !== 'custom') return false;
    return options[key] !== DEFAULTS[key];
  }).length;
