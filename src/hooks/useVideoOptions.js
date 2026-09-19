import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULTS, changedCount } from '../lib/videoOptions';

const STORAGE_KEY = 'xplainer.videoOptions.v1';

/**
 * The studio settings, remembered between visits.
 *
 * Persisted because these are a user's *taste* rather than a per-video
 * decision: someone who wants Studio with blueprint art wants it for every
 * video, and having to reselect it each time is the kind of friction that
 * stops people using the controls at all.
 *
 * Stored under a versioned key so a future change to the option vocabulary can
 * ignore an old blob instead of trying to migrate one. Everything read back is
 * merged over `DEFAULTS`, so a key that has since been removed is dropped and
 * a key that has since been added arrives at its default.
 */
const read = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return DEFAULTS;
    return { ...DEFAULTS, ...saved };
  } catch {
    // Private browsing, a disabled store, or a half-written blob. None of them
    // are worth failing a page load over — the defaults are a fine answer.
    return DEFAULTS;
  }
};

export const useVideoOptions = () => {
  const [options, setOptions] = useState(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch { /* see `read` — never fatal */ }
  }, [options]);

  const set = useCallback((key, value) => {
    setOptions((prev) => {
      if (prev[key] === value) return prev;
      const next = { ...prev, [key]: value };

      // Choosing a custom fill with no colour behind it would send the server
      // an incomplete pair, which it resolves back to "match slide" — so the
      // panel would show "Custom" while the video came back on the board
      // colour. Seed the picker instead, and let the swatches change it.
      if (key === 'background' && value === 'custom' && !prev.backgroundColor) {
        next.backgroundColor = '#FFFFFF';
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setOptions(DEFAULTS), []);

  return {
    options,
    set,
    reset,
    isDefault: useMemo(() => changedCount(options) === 0, [options]),
  };
};
