import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

/**
 * Sticky chapter list with a live position marker.
 *
 * `IntersectionObserver` with a top-biased root margin is what keeps the
 * highlight honest: a section counts as current once its heading reaches the
 * upper third of the viewport, which is where a reader's eye actually is.
 */
const DocsNav = ({ sections }) => {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -62% 0px', threshold: 0 }
    );

    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="px-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-mist-500">
        On this page
      </p>

      <ul className="mt-3 space-y-0.5 border-l border-line">
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={clsx(
                  '-ml-px flex items-baseline gap-2.5 border-l-2 py-1.5 pl-4 pr-2 transition-colors',
                  isActive
                    ? 'border-accent font-semibold text-accent-fg'
                    : 'border-transparent text-mist-400 hover:border-line-strong hover:text-mist-100'
                )}
              >
                <span className="ff-mono text-[10.5px] text-mist-500">{section.number}</span>
                <span className="leading-snug">{section.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default DocsNav;
