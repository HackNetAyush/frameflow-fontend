import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlaySquare, BookOpen, Cpu, X, ArrowUpRight } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import clsx from 'clsx';

import Brand from './Brand';

const NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/videos', label: 'My Videos', icon: PlaySquare, counter: true },
];

const Sidebar = ({ videoCount, isEngineReady, isOpen, onClose }) => {
  const { user } = useUser();

  const itemClass = ({ isActive }) =>
    clsx(
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-accent-soft text-accent-fg'
        : 'text-mist-400 hover:bg-ink-800 hover:text-mist-100'
    );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-ink-900 transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-[68px] shrink-0 items-center gap-2.5 px-5">
          <Brand to="/" />
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-mist-400 hover:bg-ink-800 hover:text-mist-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={itemClass}>
              {({ isActive }) => (
                <>
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                  {item.counter && videoCount ? (
                    <span className="ml-auto rounded-full bg-ink-700 px-2 py-0.5 text-[11px] font-semibold text-mist-300">
                      {videoCount}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-line" />

          {/*
           * The docs page lives outside the app shell so it can use the full
           * width for its own table of contents — and so it stays readable
           * without an account.
           */}
          <NavLink to="/how-it-works" onClick={onClose} className={itemClass}>
            {({ isActive }) => (
              <>
                <BookOpen className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>How it works</span>
                <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </>
            )}
          </NavLink>
        </nav>

        {/* Engine status — real state, not a mock upgrade card */}
        <div className="mt-auto space-y-3 p-4">
          <div className="rounded-xl border border-line bg-ink-850 p-4">
            <div className="flex items-center gap-2 text-mist-100">
              <Cpu className="h-4 w-4 text-accent-fg" />
              <span className="text-[13px] font-semibold">Render engine</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-400">
              Videos render in your browser with WebCodecs &amp; WebAssembly — nothing is uploaded.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  isEngineReady ? 'bg-accent' : 'bg-amber-400'
                )}
              />
              <span className="text-[11px] font-medium text-mist-300">
                {isEngineReady ? 'Ready' : 'Loading…'}
              </span>
            </div>
          </div>

          {/* Account */}
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink-850 px-3 py-2.5">
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: 'h-7 w-7' } }}
            />
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-mist-100">
                {user?.firstName || user?.username || 'Signed in'}
              </p>
              <p className="truncate text-[11px] text-mist-500">
                {user?.primaryEmailAddress?.emailAddress || 'Manage account'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
