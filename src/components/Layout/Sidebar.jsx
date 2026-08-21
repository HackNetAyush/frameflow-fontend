import React from 'react';
import { Home, PlaySquare, Cpu, X } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ view, onViewChange, videoCount, isEngineReady, isOpen, onClose }) => {
  const nav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'videos', label: 'My Videos', icon: PlaySquare, badge: videoCount || null },
  ];

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
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent-soft text-accent-fg">
            <X className="h-4.5 w-4.5" strokeWidth={3} />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-mist-100">Xplainer</span>

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
          {nav.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onClose?.();
                }}
                className={clsx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-soft text-accent-fg'
                    : 'text-mist-400 hover:bg-ink-800 hover:text-mist-100'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-ink-700 px-2 py-0.5 text-[11px] font-semibold text-mist-300">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Engine status — replaces the mock "Upgrade to Pro" card with real state */}
        <div className="mt-auto p-4">
          <div className="rounded-xl border border-line bg-ink-850 p-4">
            <div className="flex items-center gap-2 text-mist-100">
              <Cpu className="h-4 w-4 text-accent-fg" />
              <span className="text-[13px] font-semibold">Render engine</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist-400">
              Videos render in your browser with WebAssembly &amp; FFmpeg — nothing is uploaded.
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
