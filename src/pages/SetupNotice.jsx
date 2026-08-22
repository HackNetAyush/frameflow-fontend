import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, ExternalLink } from 'lucide-react';

import Brand from '../components/Layout/Brand';

/**
 * Shown instead of a white screen when `VITE_CLERK_PUBLISHABLE_KEY` is missing.
 * The landing page still works without it; only the account routes need a key.
 */
const SetupNotice = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-16 text-mist-100">
    <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-50" />

    <div className="relative w-full max-w-xl">
      <Brand to="/" size="lg" />

      <div className="ff-card mt-8 rounded-2xl border border-line bg-ink-900 p-7">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent-fg">
          <KeyRound className="h-5 w-5" />
        </span>

        <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em]">Add your Clerk key</h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-mist-400">
          Accounts are handled by Clerk, and the frontend needs its publishable key before
          sign-in can run. It takes about a minute.
        </p>

        <ol className="mt-7 space-y-4">
          {[
            <>
              Create a free application at{' '}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent-fg hover:underline"
              >
                dashboard.clerk.com
                <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            </>,
            <>
              Copy the <span className="ff-code">Publishable key</span> from{' '}
              <span className="ff-code">API Keys</span>
            </>,
            <>
              Paste it into <span className="ff-code">frameflow-fontend/.env</span> as shown below,
              then restart <span className="ff-code">npm run dev</span>
            </>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-mist-300">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-ink-850 text-[11.5px] font-bold text-mist-400">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <pre className="ff-mono mt-6 overflow-x-auto rounded-xl border border-line bg-ink-850 p-4 text-[12.5px] leading-relaxed text-mist-300">
          <span className="text-mist-500"># frameflow-fontend/.env</span>
          {'\n'}VITE_CLERK_PUBLISHABLE_KEY=<span className="text-accent-fg">pk_test_xxxxxxxxxxxx</span>
        </pre>

        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-medium text-mist-400 transition-colors hover:text-mist-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the landing page
        </Link>
      </div>
    </div>
  </div>
);

export default SetupNotice;
