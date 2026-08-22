import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { ArrowLeft, Cpu, ShieldCheck, Wand2 } from 'lucide-react';

import Brand from '../components/Layout/Brand';
import ThemeToggle from '../components/Layout/ThemeToggle';
import { useThemeMode } from '../theme/context';

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
    title: 'Your session, your videos',
    body: 'Clerk handles sign-in, so your library is scoped to your account.',
  },
];

/** Sign-in and sign-up share this frame; only the Clerk widget swaps. */
const AuthPage = ({ mode = 'sign-in' }) => {
  const { theme, toggleTheme } = useThemeMode();
  const isSignUp = mode === 'sign-up';

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
          <div className="w-full max-w-[400px]">
            <div className="mb-6 text-center lg:hidden">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>

            {isSignUp ? (
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/app"
              />
            ) : (
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/app"
              />
            )}

            <p className="mt-6 text-center text-[11.5px] leading-relaxed text-mist-500">
              {isSignUp
                ? 'Creating an account gives you a private video library for the session.'
                : 'Sessions are managed by Clerk. We never see your password.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
