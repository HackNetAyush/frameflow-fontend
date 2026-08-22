import React from 'react';
import { Sparkles, ArrowRight, Mic, Image as ImageIcon, Film, FileText } from 'lucide-react';

/*
 * The slide palette below is copied from the `studio` preset in
 * `src/render/theme.js` — the real renderer's default. The mock is deliberately
 * light-on-dark for that reason: it is what the exported MP4 actually looks
 * like, not a stylised interpretation of it.
 */
const SLIDE = {
  bg: '#FBFCFD',
  tint: '#F1F5F8',
  ink: '#0F151D',
  inkSoft: '#46536A',
  faint: '#7A879B',
  rule: '#DCE3EB',
  accent: '#0E6E8C',
  wash: '#E3F1F6',
};

const PHASES = [
  { icon: FileText, label: 'Script' },
  { icon: Mic, label: 'Narration' },
  { icon: ImageIcon, label: 'Visuals' },
  { icon: Film, label: 'Encode' },
];

const SlideMock = () => (
  <div
    className="relative aspect-video w-full overflow-hidden rounded-xl"
    style={{ background: SLIDE.bg }}
    aria-hidden="true"
  >
    <div className="flex h-full flex-col p-[5.5%]">
      {/* Heading + rule, the way the layout engine sets an h1 */}
      <p
        className="text-[clamp(15px,2.9cqw,26px)] font-extrabold leading-tight tracking-[-0.02em]"
        style={{ color: SLIDE.ink, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}
      >
        Photosynthesis
      </p>
      <span
        className="mt-[2.2%] block h-[3px] w-[16%] rounded-full"
        style={{ background: SLIDE.accent }}
      />

      <div className="mt-[4.5%] flex min-h-0 flex-1 gap-[4.5%]">
        {/* Body column */}
        <div className="flex min-w-0 flex-[1.25] flex-col gap-[4.5%]">
          {['Light energy is captured by chlorophyll', 'Water is split, releasing oxygen'].map(
            (line) => (
              <div key={line} className="flex gap-[3.5%]">
                <span
                  className="mt-[0.45em] h-[0.42em] w-[0.42em] shrink-0 rounded-full"
                  style={{ background: SLIDE.accent }}
                />
                <p
                  className="text-[clamp(7px,1.42cqw,13px)] leading-[1.45]"
                  style={{ color: SLIDE.inkSoft }}
                >
                  {line}
                </p>
              </div>
            )
          )}

          {/* Typeset equation */}
          <div
            className="rounded-lg px-[5%] py-[4.5%]"
            style={{ background: SLIDE.wash }}
          >
            <p
              className="text-center text-[clamp(7px,1.45cqw,13.5px)] leading-snug"
              style={{ color: SLIDE.accent, fontFamily: '"STIX Two Text", Georgia, serif' }}
            >
              6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
            </p>
          </div>
        </div>

        {/* Generated figure */}
        <div
          className="relative flex-1 overflow-hidden rounded-lg"
          style={{ background: SLIDE.tint, border: `1px solid ${SLIDE.rule}` }}
        >
          <svg viewBox="0 0 120 120" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <circle cx="96" cy="24" r="13" fill="#F5C542" opacity="0.9" />
            <g stroke="#F5C542" strokeWidth="2" strokeLinecap="round" opacity="0.75">
              <path d="M84 12l-6-6M108 12l6-6M78 24h-8" />
            </g>
            <path
              d="M60 112V62"
              stroke="#3F7A3A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M60 74c-16-2-24-12-26-24 14-2 24 6 26 24z"
              fill="#4E9A47"
            />
            <path
              d="M60 62c16-3 26-14 28-27-15-1-26 8-28 27z"
              fill="#63B85A"
            />
            <path d="M34 96h52" stroke={SLIDE.rule} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Slide chrome — mirrors paintChrome(): counter left, progress rail right */}
      <div className="mt-[4%] flex items-center gap-[3%]">
        <span
          className="text-[clamp(5.5px,1.05cqw,10px)] font-semibold tracking-[0.16em]"
          style={{ color: SLIDE.faint }}
        >
          04 / 09
        </span>
        <span
          className="relative h-[2px] flex-1 overflow-hidden rounded-full"
          style={{ background: SLIDE.rule }}
        >
          <span
            className="absolute inset-y-0 left-0 w-[44%] rounded-full"
            style={{ background: SLIDE.accent }}
          />
        </span>
      </div>
    </div>
  </div>
);

/**
 * The hero's product shot: a window with the prompt the user typed, the frame
 * the renderer produced from it, and the phase strip that ran in between.
 */
const ProductFrame = () => (
  <div className="relative">
    {/* Glow behind the frame */}
    <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 ff-bloom blur-2xl" />

    <div className="relative overflow-hidden rounded-2xl border border-line bg-ink-900">
      {/* Window bar */}
      <div className="flex h-10 items-center gap-2 border-b border-line px-4">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
        </span>
        <span className="ff-mono mx-auto rounded-md border border-line bg-ink-850 px-2.5 py-1 text-[10.5px] text-mist-500">
          xplainer.app/app
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* Prompt row */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-850 px-3.5 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-accent-fg" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-mist-200">
            Explain photosynthesis to a class of 14-year-olds
          </p>
          <span className="hidden items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-[11.5px] font-semibold text-on-accent sm:flex">
            Generate
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>

        {/* Rendered frame */}
        <div className="rounded-xl border border-line bg-black p-2 [container-type:inline-size]">
          <SlideMock />
        </div>

        {/* Phase strip */}
        <div className="flex flex-wrap items-center gap-2">
          {PHASES.map((phase, i) => (
            <span
              key={phase.label}
              className={
                i < 3
                  ? 'flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent-fg'
                  : 'flex items-center gap-1.5 rounded-full border border-line bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-mist-400'
              }
            >
              <phase.icon className="h-3 w-3" />
              {phase.label}
            </span>
          ))}

          <span className="ml-auto flex items-center gap-2">
            <span className="relative h-1 w-20 overflow-hidden rounded-full bg-ink-800">
              <span
                className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-accent"
                style={{ animation: 'ff-sheen 2.6s ease-in-out infinite' }}
              />
            </span>
            <span className="ff-mono text-[10.5px] text-mist-500">1080p · 30fps</span>
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default ProductFrame;
