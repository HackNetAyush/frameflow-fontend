import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cpu, ShieldCheck, Wand2, Loader2, Mail, Lock, User } from 'lucide-react';

import Brand from '../components/Layout/Brand';
import ThemeToggle from '../components/Layout/ThemeToggle';
import GoogleButton from '../components/Auth/GoogleButton';
import { useThemeMode } from '../theme/context';
import { signIn, signUp } from '../lib/authClient';

const PITCH = [
  {
    icon: Wand2,
    title: 'Prompt in, lesson out',
    body: 'A topic becomes a scripted, narrated, illustrated explainer video.',
  },
  {
    icon: Cpu,
    title: 'Rendered on your machine',
    body: 'Frames are painted and encoded in your browser with WebCodecs.',
  },
  {
    icon: ShieldCheck,
    title: 'Your session, your workspace',
    body: 'Sign in to generate. Download videos you want to keep before closing the tab.',
  },
];

const field =
  'w-full rounded-lg border border-line bg-ink-950 py-2.5 pl-10 pr-3 text-[14px] text-mist-100 outline-none transition-colors placeholder:text-mist-500 focus:border-accent';

/** Sign-in and sign-up share this frame; the form swaps on `mode`. */
const AuthPage = ({ mode = 'sign-in' }) => {
  const { theme, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSignUp = mode === 'sign-up';

  const redirect = params.get('redirect') || '/app';
  const otherHref = `${isSignUp ? '/sign-in' : '/sign-up'}${
    redirect !== '/app' ? `?redirect=${encodeURIComponent(redirect)}` : ''
  }`;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = isSignUp
        ? await signUp.email({ name: name.trim(), email: email.trim(), password })
        : await signIn.email({ email: email.trim(), password });

      if (res.error) {
        setError(res.error.message || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      navigate(redirect, { replace: true });
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-mist-100 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* --- pitch panel (desktop only) --- */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-60" />
        <div className="pointer-events-none absolute inset-0 ff-bloom" />

        <div className="relative">
          <Brand to="/" size="lg" />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[38px] font-extrabold leading-[1.1] tracking-[-0.03em] text-mist-100">
            Teach anything
            <br />
            in <span className="text-accent-fg">one prompt</span>.
          </h1>
          <p className="mt-5 text-[14.5px] leading-relaxed text-mist-400">
            Xplainer writes the script, records the narration, draws the visuals and renders a
            1080p video — start to finish, while you watch.
          </p>

          <ul className="mt-9 space-y-5">
            {PITCH.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-850 text-accent-fg">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-mist-100">{item.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-mist-400">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11.5px] text-mist-500">
          Built with Azure OpenAI, Azure Speech, FLUX and WebCodecs.
        </p>
      </aside>

      {/* --- form panel --- */}
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:min-h-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-mist-400 transition-colors hover:bg-ink-850 hover:text-mist-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back home
          </Link>
          <div className="ml-auto lg:hidden">
            <Brand to="/" />
          </div>
          <div className="ml-auto hidden lg:block">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            <div className="mb-6 text-center lg:hidden">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-mist-100">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1.5 text-[13px] text-mist-400">
              {isSignUp
                ? 'Start turning prompts into explainer videos.'
                : 'Sign in to your studio.'}
            </p>

            <div className="mt-6">
              <GoogleButton redirect={redirect} setError={setError} />
            </div>

            <div className="my-5 flex items-center gap-3 text-[11.5px] text-mist-500">
              <span className="h-px flex-1 bg-line" />
              or continue with email
              <span className="h-px flex-1 bg-line" />
            </div>

            {error ? (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12.5px] text-red-300"
              >
                {error}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-3">
              {isSignUp ? (
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className={field}
                  />
                </div>
              ) : null}

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={field}
                />
              </div>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Password (8+ characters)' : 'Password'}
                  className={field}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13.5px] font-semibold text-on-accent transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isSignUp ? 'Creating account…' : 'Signing in…'}
                  </>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-mist-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link to={otherHref} className="font-semibold text-accent-fg hover:underline">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
