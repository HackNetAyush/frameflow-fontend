import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * A titled code panel for the docs page.
 *
 * The highlighter is intentionally tiny — one pass, four token classes. The
 * real renderer has a proper tokeniser in `src/render/code.js`; this only has
 * to make a dozen short samples readable.
 */
const TOKEN =
  /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\/[^\n]*|#[^\n]*)|\b(const|let|var|await|async|function|return|if|else|new|for|of|in|export|import|from|class|extends|try|catch|throw|true|false|null|undefined)\b|\b(\d+(?:[._]\d+)*)\b/g;

const CLASS = ['text-tok-str', 'text-tok-com', 'text-tok-key', 'text-tok-num'];

const highlight = (code) => {
  const out = [];
  let last = 0;
  let key = 0;

  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) out.push(code.slice(last, match.index));

    // Groups 1..4 map onto CLASS in order; exactly one of them matched.
    const group = match.slice(1).findIndex(Boolean);
    out.push(
      <span key={`t${key++}`} className={CLASS[group]}>
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }

  if (last < code.length) out.push(code.slice(last));
  return out;
};

const CodeBlock = ({ title, language, code, caption }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is blocked in some contexts; the sample is still selectable.
    }
  };

  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-line bg-ink-900">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="ff-mono text-[11.5px] text-mist-400">{title}</span>
        {language ? (
          <span className="rounded-full border border-line bg-ink-850 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">
            {language}
          </span>
        ) : null}

        <button
          onClick={copy}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-mist-400 transition-colors hover:bg-ink-800 hover:text-mist-100"
        >
          {copied ? <Check className="h-3 w-3 text-accent-fg" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <pre className="ff-mono overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.65] text-mist-300">
        <code>{highlight(code)}</code>
      </pre>

      {caption ? (
        <figcaption className="border-t border-line bg-ink-850 px-4 py-2.5 text-[12px] leading-relaxed text-mist-500">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
};

export default CodeBlock;
