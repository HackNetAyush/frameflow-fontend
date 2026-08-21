import React, { useRef, useState } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const EXAMPLES = [
  { icon: '⚛️', title: 'Explain quantum physics' },
  { icon: '🌱', title: 'How does photosynthesis work?' },
  { icon: '🤖', title: 'The history of AI' },
  { icon: '⛓️', title: 'Blockchain technology' },
];

const PromptBar = ({ onSubmit, disabled }) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue('');
    onSubmit(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-900 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-2.5 h-[18px] w-[18px] shrink-0 text-accent-fg" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="What would you like to learn today?"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-mist-100 outline-none placeholder:text-mist-500 disabled:opacity-50"
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

        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className={clsx(
            'ml-auto flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-all',
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
  );
};

export default PromptBar;
