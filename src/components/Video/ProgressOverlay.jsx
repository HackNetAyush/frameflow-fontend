import React from 'react';
import { FileText, AudioLines, Image as ImageIcon, MonitorPlay, Check } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { id: 'script', label: 'Script', icon: FileText, statuses: ['generating_script'] },
  { id: 'media', label: 'Voice & visuals', icon: AudioLines, statuses: ['generating_images', 'generating_audio'] },
  { id: 'load', label: 'Assets', icon: ImageIcon, statuses: ['loading_resources', 'loading_images'] },
  { id: 'render', label: 'Rendering', icon: MonitorPlay, statuses: ['rendering'] },
  { id: 'merge', label: 'Finalizing', icon: Check, statuses: ['merging'] },
];

const ProgressOverlay = ({ status, progress, prompt }) => {
  const activeIdx = Math.max(
    STEPS.findIndex((s) => s.statuses.includes(status)),
    0
  );

  return (
    <div className="rounded-2xl border border-line bg-ink-900 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-[13px] font-semibold text-mist-100">Generating video</span>
          </div>
          {prompt ? (
            <p className="mt-1.5 truncate text-[13px] text-mist-400">{prompt}</p>
          ) : null}
        </div>
        <span className="text-2xl font-bold tabular-nums text-accent-fg">
          {Math.round(progress)}%
        </span>
      </div>

      {/*
        The bar restates the percentage shown above it, so it carries the value
        via ARIA rather than relying on fill-vs-track contrast alone — no track
        light enough to clear 3:1 against the accent stays visible on a white card.
      */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Video generation progress"
        className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-700"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="mt-5 flex flex-wrap gap-2">
        {STEPS.map((step, idx) => {
          const done = idx < activeIdx;
          const current = idx === activeIdx;
          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors',
                current
                  ? 'border-accent-line bg-accent-soft text-accent-fg'
                  : done
                    ? 'border-line bg-ink-850 text-mist-300'
                    : 'border-line bg-ink-850 text-mist-500'
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <step.icon className={clsx('h-3.5 w-3.5', current && 'animate-pulse')} />
              )}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressOverlay;
