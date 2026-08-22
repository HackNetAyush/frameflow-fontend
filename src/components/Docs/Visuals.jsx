import React from 'react';
import { ChevronRight } from 'lucide-react';

/* =========================================================== architecture ===
 * Hand-laid SVG rather than a diagramming library: it is one static picture,
 * it has to obey the theme tokens, and it must stay legible when the page is
 * printed. The wrapper scrolls horizontally on narrow screens instead of
 * shrinking the labels into illegibility.
 * ========================================================================== */

const BOX = {
  fill: 'var(--color-ink-850)',
  stroke: 'var(--color-line-strong)',
};

const Box = ({ x, y, w = 220, h = 44, label, sub, accent }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="9"
      fill={accent ? 'var(--color-accent-soft)' : BOX.fill}
      stroke={accent ? 'var(--color-accent-line)' : BOX.stroke}
    />
    <text
      x={x + 14}
      y={sub ? y + 19 : y + 26}
      fontSize="12.5"
      fontWeight="600"
      fill={accent ? 'var(--color-accent-fg)' : 'var(--color-mist-100)'}
    >
      {label}
    </text>
    {sub ? (
      <text x={x + 14} y={y + 34} fontSize="10.5" fill="var(--color-mist-500)">
        {sub}
      </text>
    ) : null}
  </g>
);

const Panel = ({ x, y, w, h, title, note }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="14"
      fill="none"
      stroke="var(--color-line)"
      strokeDasharray="4 5"
    />
    <text
      x={x + 16}
      y={y + 24}
      fontSize="11"
      fontWeight="700"
      letterSpacing="1.6"
      fill="var(--color-mist-400)"
    >
      {title}
    </text>
    {note ? (
      <text x={x + 16} y={y + 40} fontSize="10.5" fill="var(--color-mist-500)">
        {note}
      </text>
    ) : null}
  </g>
);

const Arrow = ({ from, to, y, label, dashed, up }) => {
  const dir = to > from ? 1 : -1;
  const head = to - dir * 7;
  return (
    <g>
      <line
        x1={from}
        y1={y}
        x2={head}
        y2={y}
        stroke={dashed ? 'var(--color-accent-fg)' : 'var(--color-line-strong)'}
        strokeWidth="1.6"
        className={dashed ? 'ff-wire-flow' : undefined}
      />
      <path
        d={`M${head} ${y - 4.5} L${to} ${y} L${head} ${y + 4.5} Z`}
        fill={dashed ? 'var(--color-accent-fg)' : 'var(--color-line-strong)'}
      />
      {label ? (
        <text
          x={(from + to) / 2}
          y={up ? y - 9 : y + 15}
          fontSize="10"
          textAnchor="middle"
          fill={dashed ? 'var(--color-accent-fg)' : 'var(--color-mist-500)'}
          fontFamily='"JetBrains Mono", monospace'
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

export const ArchitectureDiagram = () => (
  <figure className="my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-ink-900 p-5">
      <svg
        viewBox="0 0 980 430"
        className="h-auto w-full min-w-[880px]"
        role="img"
        aria-label="Xplainer architecture: the browser posts a prompt to an Express API, which calls Azure models and writes files the browser then fetches and renders."
      >
        {/* ---- panels ---- */}
        <Panel x={8} y={14} w={292} h={404} title="YOUR BROWSER" note="React · Canvas · WebCodecs" />
        <Panel x={372} y={14} w={288} h={404} title="NODE · EXPRESS" note="Agents & file store" />
        <Panel x={724} y={14} w={248} h={404} title="CLOUD MODELS" note="Azure & FLUX" />

        {/* ---- browser column ---- */}
        <Box x={30} y={72} label="Prompt & progress UI" sub="React 19 + Clerk session" accent />
        <Box x={30} y={146} label="Layout engine" sub="markdown → measured pages" />
        <Box x={30} y={220} label="Canvas painter" sub="1920 × 1080 frames" />
        <Box x={30} y={294} label="WebCodecs + muxer" sub="H.264 → MP4 blob" />
        <Box x={30} y={360} w={220} h={36} label="Download / play" />

        {/* ---- server column ---- */}
        <Box x={394} y={72} label="POST /api/explain" sub="NDJSON progress stream" accent />
        <Box x={394} y={146} label="TextAgent" sub="lesson steps, strict schema" />
        <Box x={394} y={220} label="VoiceAgent" sub="one WAV per step" />
        <Box x={394} y={294} label="ImageAgent" sub="one PNG per figure" />
        <Box x={394} y={360} w={220} h={36} label="AudioProcessor · static files" />

        {/* ---- cloud column ---- */}
        <Box x={744} y={146} w={208} label="Azure OpenAI" sub="gpt-5-mini · json_schema" />
        <Box x={744} y={220} w={208} label="Azure Speech" sub="neural TTS" />
        <Box x={744} y={294} w={208} label="FLUX 1.1 pro" sub="image generation" />

        {/* ---- browser ↔ server ---- */}
        <Arrow from={256} to={392} y={86} label="prompt + chatID" up />
        <Arrow from={392} to={256} y={112} label="progress events" dashed />
        <Arrow from={392} to={252} y={378} label="GET files" up />

        {/* ---- server ↔ cloud ---- */}
        <Arrow from={616} to={742} y={168} />
        <Arrow from={616} to={742} y={242} />
        <Arrow from={616} to={742} y={316} />

        {/* ---- internal flows ---- */}
        <g stroke="var(--color-line-strong)" strokeWidth="1.4">
          <path d="M140 116 V146" />
          <path d="M140 190 V220" />
          <path d="M140 264 V294" />
          <path d="M140 338 V360" />
          <path d="M504 116 V146" />
          <path d="M504 190 V220" />
          <path d="M504 264 V294" />
          <path d="M504 338 V360" />
        </g>
      </svg>
    </div>
    <figcaption className="mt-3 text-[12.5px] leading-relaxed text-mist-500">
      The server never touches a video frame. It produces text, audio and images — fetched back as
      <span className="ff-mono text-mist-400"> j1.json</span>,
      <span className="ff-mono text-mist-400"> merged/output.wav</span> and
      <span className="ff-mono text-mist-400"> images/img_N.png</span> — and the browser turns those
      into the finished MP4.
    </figcaption>
  </figure>
);

/* ================================================================== flow ===
 * A linear pipeline, drawn as chips. HTML rather than SVG so it wraps and
 * scrolls naturally on a phone.
 * ========================================================================== */

export const FlowRow = ({ steps, caption }) => (
  <figure className="my-6">
    <div className="no-scrollbar flex items-stretch gap-1.5 overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex min-w-[124px] flex-1 flex-col justify-center rounded-xl border border-line bg-ink-900 px-3.5 py-3">
            <span className="ff-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[12.5px] font-semibold leading-snug text-mist-100">
              {step.label}
            </span>
            {step.sub ? (
              <span className="mt-0.5 text-[11px] leading-snug text-mist-500">{step.sub}</span>
            ) : null}
          </div>
          {i < steps.length - 1 ? (
            <ChevronRight className="my-auto h-4 w-4 shrink-0 text-mist-500" />
          ) : null}
        </React.Fragment>
      ))}
    </div>
    {caption ? (
      <figcaption className="mt-2.5 text-[12px] leading-relaxed text-mist-500">{caption}</figcaption>
    ) : null}
  </figure>
);

/* ======================================================== progress phases ===
 * The real weights from `useVideoGenerator`'s PHASE table, drawn to scale.
 * ========================================================================== */

const PHASES = [
  { label: 'Script', range: [0, 12], detail: 'model writes the steps' },
  { label: 'Narration + visuals', range: [12, 55], detail: 'per-step audio and images' },
  { label: 'Assets', range: [55, 63], detail: 'fetch JSON, WAV, PNGs' },
  { label: 'Compose', range: [63, 70], detail: 'measure and paginate' },
  { label: 'Encode', range: [70, 98], detail: 'frames → H.264 → MP4' },
];

export const PhaseWeights = () => (
  <figure className="my-7 rounded-2xl border border-line bg-ink-900 p-5">
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-800">
      {PHASES.map((phase, i) => (
        <span
          key={phase.label}
          title={`${phase.label}: ${phase.range[0]}–${phase.range[1]}%`}
          style={{
            width: `${phase.range[1] - phase.range[0]}%`,
            opacity: 1 - i * 0.14,
          }}
          className="block bg-accent"
        />
      ))}
      <span className="block flex-1 bg-ink-700" title="Reserved for the final handoff" />
    </div>

    <dl className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {PHASES.map((phase, i) => (
        <div key={phase.label} className="flex gap-2.5">
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm bg-accent"
            style={{ opacity: 1 - i * 0.14 }}
          />
          <div>
            <dt className="text-[12.5px] font-semibold text-mist-100">
              {phase.label}{' '}
              <span className="ff-mono font-normal text-mist-500">
                {phase.range[0]}–{phase.range[1]}%
              </span>
            </dt>
            <dd className="text-[11.5px] leading-snug text-mist-500">{phase.detail}</dd>
          </div>
        </div>
      ))}
    </dl>

    <figcaption className="mt-4 border-t border-line pt-3.5 text-[12px] leading-relaxed text-mist-500">
      One monotonic scale. Each stage owns a fixed slice, so finishing a stage advances the bar
      instead of resetting it — and the last 2% is only released when the file exists.
    </figcaption>
  </figure>
);
