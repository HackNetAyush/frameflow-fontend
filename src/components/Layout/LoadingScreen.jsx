import React from 'react';
import { X } from 'lucide-react';

/**
 * Full-bleed splash. Used while the render engine warms up, and again while
 * Clerk resolves the session — same surface, different copy.
 */
const LoadingScreen = ({
  message = 'Preparing your render engine…',
  caption = 'Fonts · WebCodecs · Encoder',
}) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-fg">
        <X className="h-6 w-6" strokeWidth={3} />
      </span>
      <span className="text-2xl font-semibold tracking-tight text-mist-100">Xplainer</span>
    </div>

    <p className="mt-3 text-[13.5px] text-mist-400">{message}</p>

    <div className="relative mt-7 h-1 w-56 overflow-hidden rounded-full bg-ink-800">
      <div
        className="absolute inset-y-0 w-1/3 rounded-full bg-accent"
        style={{ animation: 'ff-sheen 1.4s ease-in-out infinite' }}
      />
    </div>

    <p className="mt-4 text-[11.5px] font-medium uppercase tracking-[0.14em] text-mist-500">
      {caption}
    </p>
  </div>
);

export default LoadingScreen;
