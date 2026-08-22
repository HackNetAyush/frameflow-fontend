import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  {
    q: 'Does my computer do the rendering, or a server?',
    a: 'Your computer. The backend only writes the script, the narration audio and the images. Every video frame is painted on a canvas in your tab and encoded with the browser\'s own H.264 encoder, so there is no render queue to wait in and no video file sitting on someone else\'s disk.',
  },
  {
    q: 'How long does one video take?',
    a: 'Most of the wait is the AI work — narration and images are generated one step at a time to stay inside API rate limits. Encoding itself is fast: WebCodecs runs on the GPU, so a few minutes of 1080p video usually encodes in seconds.',
  },
  {
    q: 'What if my browser is missing WebCodecs?',
    a: 'The app checks at startup. If the fast path is unavailable it loads ffmpeg.wasm instead and renders at a lower frame rate, so you still get a playable file — just more slowly.',
  },
  {
    q: 'Can it handle equations and code?',
    a: 'Yes. Markdown from the model is parsed into blocks, LaTeX-style math is typeset by a purpose-built layout pass, and fenced code is tokenised and syntax-highlighted before it is drawn to the canvas.',
  },
  {
    q: 'Why do I have to sign in?',
    a: 'Sign-in is handled by Clerk and keeps your video library and generation history tied to your account rather than to whoever opens the tab. The landing page and the "How it works" write-up stay open to everyone.',
  },
  {
    q: 'Do the videos stay after I close the tab?',
    a: 'Not yet. Finished videos are held as in-memory object URLs for the session, so download anything you want to keep. Persisted storage is the obvious next step.',
  },
];

const Faq = () => {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-ink-900">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-ink-850 sm:px-6 sm:py-5"
            >
              <span className="flex-1 text-[14.5px] font-semibold text-mist-100">{item.q}</span>
              <Plus
                className={clsx(
                  'mt-0.5 h-4 w-4 shrink-0 text-mist-400 transition-transform duration-300',
                  isOpen && 'rotate-45 text-accent-fg'
                )}
              />
            </button>

            <div
              className={clsx(
                'grid transition-all duration-300 ease-out',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pr-12 text-[13.5px] leading-relaxed text-mist-400 sm:px-6">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Faq;
