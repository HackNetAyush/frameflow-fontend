import React from 'react';
import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import clsx from 'clsx';

/** A numbered chapter with a hairline above it. */
export const Section = ({ id, number, title, lead, children }) => (
  <section id={id} className="mt-16 border-t border-line pt-12 first:mt-0 first:border-0 first:pt-0">
    <div className="flex items-baseline gap-3">
      <span className="ff-mono text-[12px] font-semibold text-accent-fg">{number}</span>
      <h2 className="text-[26px] font-bold leading-tight tracking-[-0.025em] text-mist-100 sm:text-[30px]">
        {title}
      </h2>
    </div>
    {lead ? <p className="mt-4 ff-prose-lead">{lead}</p> : null}
    <div className="mt-6">{children}</div>
  </section>
);

/** Body copy. Kept as a component so measure and rhythm stay uniform. */
export const P = ({ children, className }) => (
  <p className={clsx('mt-4 text-[14.5px] leading-[1.75] text-mist-300', className)}>{children}</p>
);

export const Sub = ({ children }) => (
  <h3 className="mt-9 text-[16px] font-bold tracking-[-0.01em] text-mist-100">{children}</h3>
);

const CALLOUT = {
  note: { icon: Info, ring: 'border-line', tint: 'bg-ink-850', fg: 'text-mist-400' },
  why: { icon: Lightbulb, ring: 'border-accent-line', tint: 'bg-accent-soft', fg: 'text-accent-fg' },
  limit: { icon: TriangleAlert, ring: 'border-amber-500/30', tint: 'bg-amber-500/8', fg: 'text-amber-400' },
};

/**
 * `why` is the one that earns its keep: most of this page is a list of design
 * decisions, and the reason behind a decision is the part a reader cannot
 * infer from the code.
 */
export const Callout = ({ kind = 'note', title, children }) => {
  const style = CALLOUT[kind] ?? CALLOUT.note;
  const Icon = style.icon;

  return (
    <aside className={clsx('my-6 rounded-xl border p-4 sm:p-5', style.ring, style.tint)}>
      <div className="flex items-center gap-2">
        <Icon className={clsx('h-4 w-4 shrink-0', style.fg)} />
        <p className={clsx('text-[12.5px] font-bold uppercase tracking-[0.1em]', style.fg)}>
          {title}
        </p>
      </div>
      <div className="mt-2.5 text-[13.5px] leading-relaxed text-mist-300">{children}</div>
    </aside>
  );
};

/** Small stat cards — three or four across. */
export const Facts = ({ items }) => (
  <dl className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <div key={item.label} className="rounded-xl border border-line bg-ink-900 p-4">
        <dt className="ff-mono text-[15px] font-semibold text-mist-100">{item.value}</dt>
        <dd className="mt-1 text-[11.5px] leading-snug text-mist-500">{item.label}</dd>
      </div>
    ))}
  </dl>
);

/** Two-column reference table. */
export const SpecTable = ({ rows, head }) => (
  <div className="my-6 overflow-hidden rounded-xl border border-line">
    {head ? (
      <div className="grid grid-cols-[minmax(120px,0.8fr)_1.4fr] gap-4 border-b border-line bg-ink-850 px-4 py-2.5">
        {head.map((cell) => (
          <span
            key={cell}
            className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-500"
          >
            {cell}
          </span>
        ))}
      </div>
    ) : null}

    {rows.map((row) => (
      <div
        key={row[0]}
        className="grid grid-cols-[minmax(120px,0.8fr)_1.4fr] gap-4 border-b border-line bg-ink-900 px-4 py-3 last:border-b-0"
      >
        <span className="text-[12.5px] font-semibold text-mist-100">{row[0]}</span>
        <span className="text-[12.5px] leading-relaxed text-mist-400">{row[1]}</span>
      </div>
    ))}
  </div>
);

/** An ordered list where each item has a bold lead-in. */
export const Steps = ({ items }) => (
  <ol className="my-6 space-y-4">
    {items.map((item, i) => (
      <li key={item.title} className="flex gap-3.5">
        <span className="ff-mono mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line bg-ink-850 text-[11px] font-bold text-mist-400">
          {i + 1}
        </span>
        <div>
          <p className="text-[13.5px] font-semibold text-mist-100">{item.title}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-mist-400">{item.body}</p>
        </div>
      </li>
    ))}
  </ol>
);
