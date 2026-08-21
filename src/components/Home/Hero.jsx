import React from 'react';
import { Play } from 'lucide-react';

const HeroArt = () => (
  <svg
    viewBox="0 0 320 190"
    fill="none"
    className="h-auto w-full max-w-[330px]"
    aria-hidden="true"
  >
    {/* Document */}
    <rect
      x="14"
      y="28"
      width="94"
      height="122"
      rx="10"
      stroke="var(--color-sketch)"
      strokeWidth="2.5"
    />
    <g stroke="var(--color-sketch-soft)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M32 56h58" />
      <path d="M32 72h58" />
      <path d="M32 88h40" />
      <path d="M32 104h58" />
      <path d="M32 120h30" />
    </g>

    {/* Arrow */}
    <path
      d="M126 92h50"
      stroke="var(--color-accent-fg)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="m169 84 9 8-9 8"
      stroke="var(--color-accent-fg)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Video frame */}
    <rect
      x="196"
      y="44"
      width="110"
      height="96"
      rx="12"
      stroke="var(--color-sketch)"
      strokeWidth="2.5"
    />
    <path
      d="M242 74.5v35.5l30-17.75z"
      fill="var(--color-accent-fg)"
      stroke="var(--color-accent-fg)"
      strokeWidth="6"
      strokeLinejoin="round"
    />

    {/* Sparks */}
    <g stroke="var(--color-accent-fg)" strokeWidth="3" strokeLinecap="round">
      <path d="M300 22v-12" />
      <path d="M313 30l8-8" />
      <path d="M287 30l-7-7" />
    </g>
  </svg>
);

const Hero = () => (
  <section className="flex items-center justify-between gap-8">
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md border border-accent-line bg-accent-soft text-accent-fg">
          <Play className="h-3 w-3 fill-current" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-400">
          AI Video Generator
        </span>
      </div>

      <h1 className="mt-4 text-[40px] font-extrabold leading-[1.08] tracking-[-0.03em] text-mist-100 sm:text-[52px]">
        Turn any topic
        <br />
        into a <span className="text-accent-fg">smart video</span>
      </h1>

      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mist-400">
        Create clear, engaging and professional video explainers in seconds.
      </p>
    </div>

    <div className="hidden shrink-0 md:block">
      <HeroArt />
    </div>
  </section>
);

export default Hero;
