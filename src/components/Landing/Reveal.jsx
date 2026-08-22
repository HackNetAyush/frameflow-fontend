import React, { useRef } from 'react';
import { motion as Motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * Fades a block up the first time it scrolls into view.
 *
 * One wrapper for the whole marketing page keeps the motion identical
 * everywhere, and it opts out entirely when the OS asks for reduced motion.
 */
const Reveal = ({ children, delay = 0, y = 18, className }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-12% 0px -8% 0px' });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Motion.div>
  );
};

export default Reveal;
