import React from 'react';
import { Link } from 'react-router-dom';

import Brand from '../Layout/Brand';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', to: '/app' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Sign in', to: '/sign-in' },
      { label: 'Create account', to: '/sign-up' },
    ],
  },
  {
    title: 'On this page',
    links: [
      { label: 'Pipeline', to: '/#pipeline', hash: true },
      { label: 'Features', to: '/#features', hash: true },
      { label: 'In-browser rendering', to: '/#browser', hash: true },
      { label: 'FAQ', to: '/#faq', hash: true },
    ],
  },
];

const STACK = ['React 19', 'Vite', 'Tailwind v4', 'Clerk', 'Express', 'Azure OpenAI', 'Azure Speech', 'FLUX', 'WebCodecs'];

const Footer = () => (
  <footer className="border-t border-line bg-ink-900">
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand to="/" />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-mist-400">
            An AI explainer-video studio that scripts, narrates, illustrates and renders — with the
            render step running in your own browser.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.hash ? (
                    <a
                      href={link.to}
                      className="text-[13px] text-mist-400 transition-colors hover:text-accent-fg"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-[13px] text-mist-400 transition-colors hover:text-accent-fg"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
        <p className="text-[12px] text-mist-500">
          Xplainer — a student project on browser-side video generation.
        </p>
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-line bg-ink-850 px-2.5 py-1 text-[10.5px] font-medium text-mist-400"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
