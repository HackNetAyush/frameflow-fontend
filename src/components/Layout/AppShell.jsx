import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import clsx from 'clsx';

import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useThemeMode } from '../../theme/context';

/**
 * The signed-in chrome: fixed sidebar, 68px top bar, one scroll region.
 * Pages only supply their title and content.
 */
const AppShell = ({ title, videoCount = 0, isEngineReady = false, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950 text-mist-100">
      <Sidebar
        videoCount={videoCount}
        isEngineReady={isEngineReady}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-line px-5 sm:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-mist-400 hover:bg-ink-800 hover:text-mist-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h2 className="text-[15px] font-semibold text-mist-100">{title}</h2>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 sm:flex">
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  isEngineReady ? 'bg-accent' : 'bg-amber-400'
                )}
              />
              <span className="text-[11.5px] font-medium text-mist-300">
                {isEngineReady ? 'Engine ready' : 'Warming up'}
              </span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppShell;
