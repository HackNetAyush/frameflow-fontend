import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import clsx from 'clsx';

import Avatar from './Avatar';
import { useSession, signOut } from '../../lib/authClient';

/**
 * Account avatar with a dropdown — the replacement for Clerk's UserButton.
 * `align` controls which edge the menu opens from so it stays on-screen in the
 * sidebar (bottom-left) and the top nav (top-right).
 */
const AccountMenu = ({
  align = 'right',
  avatarClass = 'h-8 w-8',
  children,
  triggerClassName,
}) => {
  const { data } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const user = data?.user;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName
          || 'flex items-center rounded-full outline-none ring-accent transition hover:opacity-90 focus-visible:ring-2'
        }
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {children || <Avatar user={user} className={avatarClass} />}
      </button>

      {open ? (
        <div
          role="menu"
          className={clsx(
            'absolute z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-ink-900 shadow-xl shadow-black/40',
            align === 'right' ? 'right-0' : 'left-0',
            align === 'up' ? 'bottom-full mb-2 mt-0 left-0' : '',
          )}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar user={user} className="h-9 w-9 text-[12px]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-mist-100">
                {user.name || 'Your account'}
              </p>
              <p className="truncate text-[11.5px] text-mist-500">{user.email}</p>
            </div>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/app/account'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100"
            >
              <Settings className="h-4 w-4" />
              Account settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={busy}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AccountMenu;
