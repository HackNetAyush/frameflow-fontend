import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, RotateCcw, Info } from 'lucide-react';
import clsx from 'clsx';

import { THEMES } from '../../render/theme';
import { ensureReadable } from '../../lib/color';
import {
  THEME_OPTIONS, ACCENT_PRESETS, ART_STYLE_OPTIONS, IMAGERY_OPTIONS,
  DEPTH_OPTIONS, BACKGROUND_OPTIONS, BACKGROUND_PRESETS,
  summarize, changedCount,
} from '../../lib/videoOptions';

/**
 * The studio controls: everything about how a video looks, in one panel.
 *
 * Collapsed by default and summarised in a line, because the defaults are the
 * whole product for most people and an eight-section form above the prompt box
 * would read as work to be done before you are allowed to type.
 */

const Field = ({ label, hint, disabled, children }) => (
  <div className={clsx('transition-opacity', disabled && 'pointer-events-none opacity-40')}>
    <div className="flex items-baseline gap-2">
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-mist-300">{label}</h4>
      {hint ? <span className="text-[11.5px] text-mist-500">{hint}</span> : null}
    </div>
    <div className="mt-2.5">{children}</div>
  </div>
);

const Chip = ({ selected, onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-pressed={selected}
    className={clsx(
      'rounded-lg border px-3 py-1.5 text-left text-[12.5px] font-medium transition-colors',
      selected
        ? 'border-accent-line bg-accent-soft text-accent-fg'
        : 'border-line bg-ink-850 text-mist-300 hover:border-line-strong hover:text-mist-100',
    )}
  >
    {children}
  </button>
);

/** Chips whose hint is worth showing inline rather than only on hover. */
const ChipGrid = ({ options, value, onSelect, columns = 'sm:grid-cols-4' }) => (
  <div className={clsx('grid grid-cols-2 gap-2', columns)}>
    {options.map((option) => (
      <Chip key={option.id} selected={value === option.id} onClick={() => onSelect(option.id)}>
        <span className="block truncate">{option.label}</span>
        {option.hint ? (
          // Wraps rather than truncates: several hints are the whole reason to
          // pick one option over another, and half of "slower to generate" is
          // worse than no hint at all.
          <span className="mt-0.5 block text-[11px] font-normal leading-snug opacity-70">{option.hint}</span>
        ) : null}
      </Chip>
    ))}
  </div>
);

/**
 * A miniature of the real thing: the board colour, the ink, and the accent
 * rule the footer draws — all read from the renderer's own tokens, and the
 * accent passed through the same contrast adjustment the video will apply. It
 * is the only honest way to show what "Studio + lime" actually looks like.
 */
const BoardPreview = ({ theme, accent }) => {
  const t = THEMES[theme] ?? THEMES.midnight;
  const ink = accent ? ensureReadable(accent, t.bg) : t.accent;

  return (
    <span
      aria-hidden="true"
      className="flex h-full w-[74px] shrink-0 flex-col justify-between overflow-hidden rounded-md p-2"
      style={{ background: t.bg }}
    >
      <span className="flex flex-col gap-[3px]">
        <span className="h-[4px] w-[68%] rounded-full" style={{ background: ink }} />
        <span className="h-[3px] w-[90%] rounded-full" style={{ background: t.inkSoft }} />
        <span className="h-[3px] w-[76%] rounded-full" style={{ background: t.inkSoft }} />
        <span className="h-[3px] w-[84%] rounded-full" style={{ background: t.inkSoft }} />
      </span>
      <span className="h-[3px] w-full rounded-full" style={{ background: t.ruleSoft }}>
        <span className="block h-full w-[45%] rounded-full" style={{ background: ink }} />
      </span>
    </span>
  );
};

const Swatch = ({ color, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={selected}
    className={clsx(
      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
      selected ? 'border-mist-100 scale-110' : 'border-line',
    )}
    style={{ background: color }}
  />
);

const StudioOptions = ({ options, onChange, onReset, disabled }) => {
  const [open, setOpen] = useState(false);
  const changed = changedCount(options);

  // Style and background only describe artwork, so they have nothing to say
  // once the lesson is text-only. Dimmed rather than hidden: a control that
  // disappears reads as a bug, while one that greys out explains itself.
  const noImages = options.imagery === 'none';
  const board = THEMES[options.theme] ?? THEMES.midnight;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink-900">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-mist-400" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-mist-100">Video settings</span>
              {changed > 0 ? (
                <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-fg">
                  {changed} changed
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-mist-500">{summarize(options)}</span>
          </span>
          <ChevronDown
            className={clsx('h-4 w-4 shrink-0 text-mist-400 transition-transform', open && 'rotate-180')}
          />
        </button>

        {changed > 0 ? (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-mist-400 transition-colors hover:border-line-strong hover:text-mist-100 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className={clsx(
            'space-y-6 border-t border-line px-4 py-5 sm:px-5',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          {/* --- Theme ------------------------------------------------- */}
          <Field label="Video theme">
            <div className="grid gap-2 sm:grid-cols-2">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange('theme', option.id)}
                  aria-pressed={options.theme === option.id}
                  className={clsx(
                    'flex items-stretch gap-3 rounded-xl border p-2.5 text-left transition-colors',
                    options.theme === option.id
                      ? 'border-accent-line bg-accent-soft'
                      : 'border-line bg-ink-850 hover:border-line-strong',
                  )}
                >
                  <BoardPreview theme={option.id} accent={options.accent} />
                  <span className="min-w-0 self-center">
                    <span
                      className={clsx(
                        'block text-[13.5px] font-semibold',
                        options.theme === option.id ? 'text-accent-fg' : 'text-mist-100',
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-mist-500">
                      {option.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Field>

          {/* --- Accent ------------------------------------------------ */}
          <Field label="Accent colour" hint="Headings, rules and illustration linework">
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={options.accent === null} onClick={() => onChange('accent', null)}>
                Theme default
              </Chip>

              {ACCENT_PRESETS.filter((a) => a.id).map((a) => (
                <Swatch
                  key={a.id}
                  // Shown as it will actually be drawn on the chosen board, not
                  // as the raw preset — otherwise a swatch promises a lime the
                  // Studio board will render as olive.
                  color={ensureReadable(a.id, board.bg)}
                  label={a.label}
                  selected={options.accent === a.id}
                  onClick={() => onChange('accent', a.id)}
                />
              ))}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-medium text-mist-300 transition-colors hover:border-line-strong hover:text-mist-100">
                <input
                  type="color"
                  value={options.accent ?? board.accent}
                  onChange={(e) => onChange('accent', e.target.value.toUpperCase())}
                  className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                Custom
              </label>
            </div>
          </Field>

          {/* --- Illustration style ------------------------------------ */}
          <Field
            label="Illustration style"
            hint={noImages ? 'Not used — this lesson has no images' : undefined}
            disabled={noImages}
          >
            <ChipGrid
              options={ART_STYLE_OPTIONS}
              value={options.artStyle}
              onSelect={(id) => onChange('artStyle', id)}
              columns="sm:grid-cols-3 lg:grid-cols-4"
            />
          </Field>

          {/* --- Imagery ----------------------------------------------- */}
          <Field label="How many illustrations" hint="Images are the slowest part of a render">
            <ChipGrid
              options={IMAGERY_OPTIONS}
              value={options.imagery}
              onSelect={(id) => onChange('imagery', id)}
            />
          </Field>

          {/* --- Depth -------------------------------------------------- */}
          <Field label="Lesson length">
            <ChipGrid
              options={DEPTH_OPTIONS}
              value={options.depth}
              onSelect={(id) => onChange('depth', id)}
              columns="sm:grid-cols-3"
            />
          </Field>

          {/* --- Image background --------------------------------------- */}
          <Field
            label="Image background"
            hint={noImages ? 'Not used — this lesson has no images' : undefined}
            disabled={noImages}
          >
            <ChipGrid
              options={BACKGROUND_OPTIONS}
              value={options.background}
              onSelect={(id) => onChange('background', id)}
              columns="sm:grid-cols-3"
            />

            {options.background === 'custom' ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {BACKGROUND_PRESETS.map((preset) => (
                  <Swatch
                    key={preset.id}
                    color={preset.id}
                    label={preset.label}
                    selected={options.backgroundColor === preset.id}
                    onClick={() => onChange('backgroundColor', preset.id)}
                  />
                ))}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-ink-850 px-2.5 py-1.5 text-[12.5px] font-medium text-mist-300 transition-colors hover:border-line-strong hover:text-mist-100">
                  <input
                    type="color"
                    value={options.backgroundColor ?? '#FFFFFF'}
                    onChange={(e) => onChange('backgroundColor', e.target.value.toUpperCase())}
                    className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  {options.backgroundColor ?? 'Pick'}
                </label>
              </div>
            ) : null}

            {options.background === 'transparent' && !noImages ? (
              <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-500">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Cut-out artwork composites perfectly onto any slide, but roughly doubles the time
                each image takes. Not every image provider supports it — the server falls back to
                the board colour when it cannot.
              </p>
            ) : null}
          </Field>
        </div>
      ) : null}
    </div>
  );
};

export default StudioOptions;
