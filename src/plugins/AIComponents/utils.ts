import { useEffect, useState } from 'react';

const unit = (locale: string, value: number, name: 'minute' | 'second') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: name,
      unitDisplay: 'narrow',
    }).format(value);
  } catch {
    return `${value}${name === 'minute' ? 'm' : 's'}`;
  }
};

/**
 * A whole number of seconds as minutes and seconds, in narrow units: "7s", "1m 5s".
 */
export const formatMinutesAndSeconds = (totalSeconds: number, locale = 'en') => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return unit(locale, rest, 'second');
  if (rest === 0) return unit(locale, minutes, 'minute');
  return `${unit(locale, minutes, 'minute')} ${unit(locale, rest, 'second')}`;
};

/** A tool call's duration: tenths below a second ("0.4s"), then minutes and seconds. */
export const formatCallDuration = (durationSeconds: number, locale = 'en') =>
  durationSeconds < 1
    ? unit(locale, Math.round(durationSeconds * 10) / 10, 'second')
    : formatMinutesAndSeconds(Math.round(durationSeconds), locale);

/** `Date.now()`, refreshed every `intervalMs` while `active`. */
export const useNow = (active: boolean, intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
  return now;
};

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
