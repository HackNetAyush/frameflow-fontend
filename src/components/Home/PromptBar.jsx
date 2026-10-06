import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const EXAMPLES = [
  { icon: '⚛️', title: 'Explain quantum physics' },
  { icon: '🌱', title: 'How does photosynthesis work?' },
  { icon: '🤖', title: 'The history of AI' },
  { icon: '⛓️', title: 'Blockchain technology' },
];

// Grow with the content up to this height, then scroll inside the field.
const MAX_HEIGHT = 220;

const PromptBar = ({ onSubmit, disabled }) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');

  // Reflow the textarea height to fit its content. Runs on every value change,
  // so a pasted multi-line prompt expands the field instead of hiding in a
  // one-line scroller.
  const resize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue('');
    onSubmit(text);
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter (and the mobile return key behaviour) inserts a
    // newline, which multi-paragraph prompts need.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-900 p-4 transition-colors focus-within:border-line-strong sm:p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1.5 h-[18px] w-[18px] shrink-0 text-accent-fg" />
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="What would you like to learn today? Paste a topic, outline, or a few paragraphs…"
          aria-label="Lesson prompt"
          className="min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-mist-100 outline-none placeholder:text-mist-500 disabled:opacity-50"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Quick example prompts */}
        <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              type="button"
              disabled={disabled}
              onClick={() => {
                setValue(ex.title);
                inputRef.current?.focus();
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-ink-850 px-3 py-1.5 text-[12px] font-medium text-mist-300 transition-colors hover:border-line-strong hover:text-mist-100 disabled:opacity-40"
            >
              <span className="text-[13px]">{ex.icon}</span>
              {ex.title}
            </button>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="hidden text-[11px] text-mist-500 sm:block">
            <kbd className="rounded border border-line bg-ink-850 px-1.5 py-0.5 font-sans text-[10px]">Enter</kbd>
            {' '}to send ·{' '}
            <kbd className="rounded border border-line bg-ink-850 px-1.5 py-0.5 font-sans text-[10px]">Shift</kbd>
            {'+'}
            <kbd className="rounded border border-line bg-ink-850 px-1.5 py-0.5 font-sans text-[10px]">Enter</kbd>
            {' '}for a new line
          </span>
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-all',
              disabled || !value.trim()
                ? 'cursor-not-allowed bg-ink-700 text-mist-500'
                : 'bg-accent text-on-accent hover:bg-accent-strong'
            )}
          >
            {disabled ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                Generate Video
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
