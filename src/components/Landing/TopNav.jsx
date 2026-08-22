import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Menu, X as Close, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

import Brand from '../Layout/Brand';
import ThemeToggle from '../Layout/ThemeToggle';
import { useThemeMode } from '../../theme/context';
import { useSignedIn } from '../../hooks/useSignedIn';

const LINKS = [
  { label: 'Pipeline', to: '/#pipeline' },
  { label: 'Features', to: '/#features' },
  { label: 'In-browser', to: '/#browser' },
  { label: 'FAQ', to: '/#faq' },
];

/** Sticky marketing header. Goes opaque once the hero scrolls under it. */
const TopNav = () => {
  const { theme, toggleTheme } = useThemeMode();
  const signedIn = useSignedIn();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-line bg-ink-950/85 backdrop-blur-xl'
          : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Brand to="/" />

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.to}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-mist-400 transition-colors hover:bg-ink-850 hover:text-mist-100"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/how-it-works"
            className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-mist-400 transition-colors hover:bg-ink-850 hover:text-mist-100"
          >
            How it works
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {signedIn ? null : (
            <Link
              to="/sign-in"
              className="hidden rounded-lg px-3 py-2 text-[13.5px] font-semibold text-mist-300 transition-colors hover:text-mist-100 sm:block"
            >
              Sign in
            </Link>
          )}

          <Link
            to={signedIn ? '/app' : '/sign-up'}
            className="hidden items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-semibold text-on-accent transition-colors hover:bg-accent-strong sm:flex"
          >
            {signedIn ? 'Open studio' : 'Get started'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {signedIn ? (
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
          ) : null}

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-mist-400 transition-colors hover:bg-ink-850 hover:text-mist-100 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {open ? (
        <div className="border-t border-line bg-ink-950/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-mist-300 hover:bg-ink-850"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/how-it-works"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-mist-300 hover:bg-ink-850"
            >
              How it works
            </Link>
          </div>

          <div className="mt-3 flex gap-2 border-t border-line pt-3">
            {signedIn ? null : (
              <Link
                to="/sign-in"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-line px-3 py-2.5 text-center text-[13.5px] font-semibold text-mist-200"
              >
                Sign in
              </Link>
            )}
            <Link
              to={signedIn ? '/app' : '/sign-up'}
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg bg-accent px-3 py-2.5 text-center text-[13.5px] font-semibold text-on-accent"
            >
              {signedIn ? 'Open studio' : 'Get started'}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default TopNav;
