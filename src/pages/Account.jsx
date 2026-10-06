import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, LogOut } from 'lucide-react';

import AppShell from '../components/Layout/AppShell';
import Avatar from '../components/Auth/Avatar';
import { useSession, updateUser, changePassword, signOut } from '../lib/authClient';

const card = 'rounded-2xl border border-line bg-ink-900 p-5 sm:p-6';
const label = 'block text-[12.5px] font-medium text-mist-300';
const input =
  'mt-1.5 w-full rounded-lg border border-line bg-ink-950 px-3 py-2.5 text-[14px] text-mist-100 outline-none transition-colors placeholder:text-mist-500 focus:border-accent disabled:opacity-60';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60';

const Notice = ({ tone, children }) => (
  <p
    className={
      tone === 'error'
        ? 'text-[12.5px] text-red-300'
        : 'flex items-center gap-1.5 text-[12.5px] text-emerald-300'
    }
  >
    {tone === 'ok' ? <Check className="h-3.5 w-3.5" /> : null}
    {children}
  </p>
);

const Account = () => {
  const { data, refetch } = useSession();
  const navigate = useNavigate();
  const user = data?.user;

  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  if (!user) return null;

  const saveName = async (e) => {
    e.preventDefault();
    setNameMsg(null);
    setSavingName(true);
    const res = await updateUser({ name: name.trim() });
    setSavingName(false);
    if (res.error) setNameMsg({ tone: 'error', text: res.error.message || 'Could not save.' });
    else {
      setNameMsg({ tone: 'ok', text: 'Saved' });
      refetch?.();
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    setSavingPw(true);
    const res = await changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setSavingPw(false);
    if (res.error) {
      setPwMsg({ tone: 'error', text: res.error.message || 'Could not change password.' });
    } else {
      setPwMsg({ tone: 'ok', text: 'Password updated' });
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const doSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <AppShell title="Account">
      <div className="mx-auto max-w-2xl space-y-5 px-5 py-8 sm:px-8">
        {/* Identity */}
        <div className={card}>
          <div className="flex items-center gap-4">
            <Avatar user={user} className="h-14 w-14 text-[16px]" />
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-mist-100">
                {user.name || 'Your account'}
              </p>
              <p className="truncate text-[13px] text-mist-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Display name */}
        <form className={card} onSubmit={saveName}>
          <h3 className="text-[14px] font-semibold text-mist-100">Profile</h3>
          <div className="mt-4">
            <label className={label} htmlFor="acc-name">Display name</label>
            <input
              id="acc-name"
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="mt-4">
            <label className={label} htmlFor="acc-email">Email</label>
            <input id="acc-email" className={input} value={user.email} disabled />
            <p className="mt-1.5 text-[11.5px] text-mist-500">Email can't be changed here.</p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className={primaryBtn} disabled={savingName || name.trim() === (user.name || '')}>
              {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
            {nameMsg ? <Notice tone={nameMsg.tone}>{nameMsg.text}</Notice> : null}
          </div>
        </form>

        {/* Password */}
        <form className={card} onSubmit={savePassword}>
          <h3 className="text-[14px] font-semibold text-mist-100">Password</h3>
          <p className="mt-1 text-[12.5px] text-mist-400">
            If you signed in with Google, you may not have a password set.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="acc-cpw">Current password</label>
              <input
                id="acc-cpw"
                type="password"
                autoComplete="current-password"
                className={input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className={label} htmlFor="acc-npw">New password</label>
              <input
                id="acc-npw"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className={input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8+ characters"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" className={primaryBtn} disabled={savingPw || !currentPassword || newPassword.length < 8}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update password
            </button>
            {pwMsg ? <Notice tone={pwMsg.tone}>{pwMsg.text}</Notice> : null}
          </div>
        </form>

        {/* Sign out */}
        <div className={card}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-semibold text-mist-100">Sign out</h3>
              <p className="mt-1 text-[12.5px] text-mist-400">End your session on this device.</p>
            </div>
            <button
              type="button"
              onClick={doSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-mist-200 transition-colors hover:bg-ink-850"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Account;
