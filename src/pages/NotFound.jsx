import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

import Brand from '../components/Layout/Brand';

const NotFound = () => (
  <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-5 text-center text-mist-100">
    <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-50" />

    <div className="relative">
      <Brand to="/" size="lg" />

      <p className="ff-mono mt-10 text-[12px] uppercase tracking-[0.2em] text-mist-500">
        Error 404
      </p>
      <h1 className="mt-3 text-[36px] font-extrabold tracking-[-0.03em] sm:text-[44px]">
        This frame does not exist
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-mist-400">
        The page you asked for is not part of the timeline. Try the studio or the write-up instead.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
        <Link
          to="/how-it-works"
          className="flex items-center gap-2 rounded-xl border border-line bg-ink-900 px-5 py-3 text-[14px] font-semibold text-mist-200 transition-colors hover:border-line-strong hover:text-mist-100"
        >
          <BookOpen className="h-4 w-4" />
          How it works
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
