import React from 'react';
import { Link } from 'react-router-dom';

import {
  ArrowRight, BookOpen, FileText, Mic, Image as ImageIcon, Film, Sigma, Code2,
  Ruler, AudioWaveform, Gauge, MonitorSmartphone, Sparkles, Check, Minus, Zap,
} from 'lucide-react';

import TopNav from '../components/Landing/TopNav';
import ProductFrame from '../components/Landing/ProductFrame';
import Reveal from '../components/Landing/Reveal';
import Faq from '../components/Landing/Faq';
import Footer from '../components/Landing/Footer';
import { useSignedIn } from '../hooks/useSignedIn';

/* ------------------------------------------------------------------ data --- */

const PIPELINE = [
  {
    icon: FileText,
    tag: 'Stage 01',
    title: 'It writes the lesson',
    body:
      'A language model turns your topic into ordered steps. Each step carries what goes on the board, what the narrator says, and what to illustrate — returned under a strict schema, so a malformed reply can never become an empty video.',
  },
  {
    icon: Mic,
    tag: 'Stage 02',
    title: 'It records the narration',
    body:
      'Every step is spoken by a neural voice and saved as its own audio clip. The measured length of that clip — not a guess — becomes the on-screen duration of the matching slide.',
  },
  {
    icon: ImageIcon,
    tag: 'Stage 03',
    title: 'It draws the visuals',
    body:
      'Steps that call for a figure get one from an image model, prompted with an art-style preset so nine slides look like one lesson instead of nine different ones.',
  },
  {
    icon: Film,
    tag: 'Stage 04',
    title: 'Your browser renders it',
    body:
      'Markdown becomes a measured layout, the layout becomes canvas frames, and the frames are encoded to H.264 by your own GPU — then muxed with the narration into an MP4 you can download.',
  },
];

const FEATURES = [
  {
    icon: Ruler,
    title: 'Text that always fits',
    body:
      'The layout engine measures real font metrics, then shrinks the type scale or splits onto a second page until the content fits 1920×1080. Nothing is ever cropped off the edge of a slide.',
  },
  {
    icon: Sigma,
    title: 'Real typeset math',
    body:
      'Fractions, roots, superscripts and Greek letters are parsed into an expression tree and laid out from it, so an equation reads like a textbook instead of like text with slashes in it.',
  },
  {
    icon: Code2,
    title: 'Highlighted code',
    body:
      'Fenced code blocks are tokenised and coloured before they are drawn, gutter included — which matters the moment the topic is a programming one.',
  },
  {
    icon: AudioWaveform,
    title: 'Narration stays locked',
    body:
      'When a slide has to split across pages, its narration window is divided between them by content weight. Voice and visuals never drift apart, however the fitter paginated.',
  },
  {
    icon: Zap,
    title: 'GPU encoding',
    body:
      'WebCodecs streams compressed chunks straight into an MP4 muxer, which is what buys 30fps 1080p output at flat memory cost. Browsers without it fall back to ffmpeg.wasm.',
  },
  {
    icon: Gauge,
    title: 'Progress that tells the truth',
    body:
      'The backend streams NDJSON events, and every phase maps onto one weighted 0–100 scale. The bar moves forward only — it never fills up and then starts over.',
  },
];

const STATS = [
  { value: '1920×1080', label: 'Output resolution' },
  { value: '30 fps', label: 'H.264 in MP4' },
  { value: '4 agents', label: 'Text, voice, image, render' },
  { value: '0 frames', label: 'Uploaded anywhere' },
];

const COMPARISON = [
  { label: 'Cost per video', browser: 'Free — your GPU', server: 'Render minutes, billed' },
  { label: 'Queue', browser: 'None, it is your tab', server: 'Shared worker pool' },
  { label: 'Video leaves your device', browser: false, server: true },
  { label: 'Capacity as users grow', browser: 'Grows with them', server: 'Needs more machines' },
  { label: 'Needs WebCodecs', browser: 'Yes — fallback included', server: false },
];

const EXAMPLES = [
  'Explain photosynthesis to a class of 14-year-olds',
  'How does HTTPS actually keep data private?',
  'Derive the quadratic formula step by step',
  'What is a neural network, without the maths',
  'Why do aeroplanes stay in the air?',
  'Big-O notation in five minutes',
  'How vaccines train the immune system',
  'The water cycle, with diagrams',
];

/* ------------------------------------------------------------- primitives --- */

const SectionLabel = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-400">
    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
    {children}
  </span>
);

const Cell = ({ value }) => {
  if (value === true)
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-fg">
        <Check className="h-3.5 w-3.5" /> Yes
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-mist-500">
        <Minus className="h-3.5 w-3.5" /> No
      </span>
    );
  return <span className="text-[13px] text-mist-300">{value}</span>;
};

/* ------------------------------------------------------------------- page --- */

const Landing = () => {
  const signedIn = useSignedIn();

  return (
    <div className="min-h-screen bg-ink-950 text-mist-100">
      <TopNav />

      {/* ============================== hero ============================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-[0.55]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] ff-bloom" />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_1fr] lg:gap-16">
            <div className="ff-fade-up">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent-soft px-3 py-1.5 text-[11.5px] font-semibold text-accent-fg transition-opacity hover:opacity-80"
              >
                <Sparkles className="h-3.5 w-3.5" />
                1080p video, rendered in the browser
                <ArrowRight className="h-3 w-3" />
              </Link>

              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.04] tracking-[-0.035em] text-mist-100 sm:text-[58px] lg:text-[62px]">
                Turn any topic into
                <br />
                a video that
                <span className="text-accent-fg"> teaches</span>.
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-mist-400 sm:text-[17px]">
                Describe what you want explained. Xplainer writes the script, records the narration,
                draws the diagrams and renders a finished, narrated 1080p explainer — while you watch
                the progress bar.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to={signedIn ? '/app' : '/sign-up'}
                  className="group flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14.5px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
                >
                  {signedIn ? 'Open the studio' : 'Start creating — free'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/how-it-works"
                  className="flex items-center gap-2 rounded-xl border border-line bg-ink-900 px-5 py-3 text-[14.5px] font-semibold text-mist-200 transition-colors hover:border-line-strong hover:text-mist-100"
                >
                  <BookOpen className="h-4 w-4" />
                  See how it works
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="ff-mono text-[15px] font-semibold text-mist-100">{stat.value}</dt>
                    <dd className="mt-1 text-[11.5px] leading-snug text-mist-500">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="ff-fade-up lg:pt-2" style={{ animationDelay: '120ms' }}>
              <ProductFrame />
            </div>
          </div>
        </div>
      </section>

      {/* ============================ examples ============================ */}
      <section className="ff-marquee overflow-hidden border-y border-line bg-ink-900 py-4">
        <div className="ff-marquee-track flex w-max gap-3">
          {[...EXAMPLES, ...EXAMPLES].map((example, i) => (
            <span
              key={`${example}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-ink-850 px-4 py-2 text-[12.5px] text-mist-400"
            >
              <Sparkles className="h-3 w-3 text-accent-fg" />
              {example}
            </span>
          ))}
        </div>
      </section>

      {/* ============================ pipeline ============================ */}
      <section id="pipeline" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal className="max-w-2xl">
          <SectionLabel>The pipeline</SectionLabel>
          <h2 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-mist-100 sm:text-[40px]">
            One prompt, four specialists,
            <br />
            one finished MP4.
          </h2>
          <p className="mt-5 ff-prose-lead">
            Nothing here is a black box. Each stage does one job and hands a concrete artefact to the
            next — a script, a set of audio clips, a set of images, and finally the frames themselves.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {PIPELINE.map((stage, i) => (
            <Reveal key={stage.title} delay={i * 0.07}>
              <article className="ff-card h-full rounded-2xl border border-line bg-ink-900 p-6 transition-colors hover:border-line-strong sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent-fg">
                    <stage.icon className="h-5 w-5" />
                  </span>
                  <span className="ff-mono text-[11px] uppercase tracking-[0.16em] text-mist-500">
                    {stage.tag}
                  </span>
                </div>

                <h3 className="mt-5 text-[19px] font-bold tracking-[-0.02em] text-mist-100">
                  {stage.title}
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist-400">{stage.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink-900 px-6 py-5">
            <p className="text-[13.5px] text-mist-400">
              Want the full engineering write-up — schemas, timing maths, encoder fallbacks?
            </p>
            <Link
              to="/how-it-works"
              className="ml-auto flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-fg transition-opacity hover:opacity-80"
            >
              Read How it works
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================ features ============================ */}
      <section id="features" className="border-y border-line bg-ink-900">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="max-w-2xl">
            <SectionLabel>Built for real lessons</SectionLabel>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-mist-100 sm:text-[40px]">
              The details that make it
              <br />
              watchable.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 0.06}>
                <div className="h-full bg-ink-900 p-7 transition-colors hover:bg-ink-850">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-800 text-accent-fg">
                    <feature.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-5 text-[15.5px] font-bold text-mist-100">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= browser ============================ */}
      <section id="browser" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionLabel>Why the browser</SectionLabel>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-mist-100 sm:text-[40px]">
              The render step never
              <br />
              leaves your machine.
            </h2>
            <p className="mt-5 ff-prose-lead">
              Server-side rendering was the obvious design, and it was rejected on purpose: a render
              farm is the most expensive part of a video product, and it means every video you make is
              written to someone else&apos;s disk first.
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-mist-400">
              Doing it in the tab flips both problems. The GPU already in front of you does the work,
              capacity grows with every new user instead of shrinking, and the finished file exists in
              exactly one place — your downloads folder.
            </p>

            <div className="mt-8 flex items-center gap-3 rounded-xl border border-line bg-ink-900 p-4">
              <MonitorSmartphone className="h-5 w-5 shrink-0 text-accent-fg" />
              <p className="text-[13px] leading-relaxed text-mist-400">
                The backend still does the AI work — it returns text, audio and images. Frames and the
                final MP4 are produced locally.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-line bg-ink-900">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-4 border-b border-line px-5 py-4 sm:px-6">
                <span aria-hidden="true" />
                <span className="text-[11.5px] font-bold text-accent-fg">In your browser</span>
                <span className="text-[11.5px] font-semibold text-mist-400">On a render server</span>
              </div>

              {COMPARISON.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6"
                >
                  <span className="text-[13px] font-medium text-mist-100">{row.label}</span>
                  <Cell value={row.browser} />
                  <Cell value={row.server} />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* =============================== faq ============================== */}
      <section id="faq" className="border-t border-line bg-ink-900">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="text-center">
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.12] tracking-[-0.03em] text-mist-100 sm:text-[40px]">
              Good things to ask first
            </h2>
          </Reveal>

          <Reveal delay={0.08} className="mt-12">
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* =============================== cta ============================== */}
      <section className="relative overflow-hidden border-t border-line">
        <div className="pointer-events-none absolute inset-0 ff-grid ff-fade-mask opacity-50" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 ff-bloom" />

        <div className="relative mx-auto w-full max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-28">
          <Reveal>
            <h2 className="text-[34px] font-extrabold leading-[1.1] tracking-[-0.035em] text-mist-100 sm:text-[44px]">
              Pick a topic.
              <br />
              Get a video.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-mist-400">
              Free to try, no render queue, and the file is yours the moment it finishes.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to={signedIn ? '/app' : '/sign-up'}
                className="group flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[14.5px] font-semibold text-on-accent transition-colors hover:bg-accent-strong"
              >
                {signedIn ? 'Open the studio' : 'Create your first video'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {signedIn ? null : (
                <Link
                  to="/sign-in"
                  className="rounded-xl border border-line bg-ink-900 px-5 py-3 text-[14.5px] font-semibold text-mist-200 transition-colors hover:border-line-strong hover:text-mist-100"
                >
                  I already have an account
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
