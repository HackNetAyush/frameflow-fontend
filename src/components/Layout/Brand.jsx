import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * The wordmark, in one place.
 *
 * It appears in the sidebar, the landing nav, the auth screens and the docs
 * header; keeping it here is what stops those four from drifting apart.
 */
const Brand = ({ to = '/', size = 'md', className }) => {
  const large = size === 'lg';

  const content = (
    <span className={clsx('flex items-center gap-2.5', className)}>
      <span
        className={clsx(
          'grid place-items-center rounded-md bg-accent-soft text-accent-fg ring-1 ring-accent-line',
          large ? 'h-9 w-9' : 'h-7 w-7'
        )}
      >
        <X className={large ? 'h-5 w-5' : 'h-4.5 w-4.5'} strokeWidth={3} />
      </span>
      <span
        className={clsx(
          'font-semibold tracking-tight text-mist-100',
          large ? 'text-[20px]' : 'text-[17px]'
        )}
      >
        Xplainer
      </span>
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-line">
      {content}
    </Link>
  );
};

export default Brand;
