import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** How much of a text the user has heard so far. */
export type HeardTextProgress = {
  /**
   * Number of characters of the text the user has heard, counted in Unicode code points
   * (as `Array.from(text).length` counts them, not UTF-16 code units like `text.length`).
   * May be fractional; it is floored before rendering. A value at or above the text's
   * code point length reveals the whole text.
   */
  chars: number;
  /** `true` once the speech for the text has finished (played out, interrupted or skipped). */
  done: boolean;
};

/**
 * Returns how much of the text the user has heard by `now` (a `performance.now()`
 * timestamp).
 *
 * Return `undefined` only for a text that is not spoken at all: the full text is then
 * shown, and the reveal never moves back past what has been shown. A text that will be
 * spoken but whose audio has not started, or that the voice source does not know yet,
 * must return `{ chars: 0, done: false }`, or it is shown in full before it is heard.
 *
 * Also called during render, so keep it free of side effects.
 */
export type HeardTextFunction = (now: number) => HeardTextProgress | undefined;

/**
 * Registers a listener that is called whenever the speech progress source changes
 * (playback started, paused, finished...). Returns an unsubscribe function.
 */
export type HeardTextSubscribe = (listener: () => void) => () => void;

export type UseHeardTextParams = {
  /** The speech progress of `text`, see `HeardTextFunction`. */
  heard: HeardTextFunction;
  /** The full text to reveal. */
  text: string;
  /**
   * `true` while the text is still being written. The full text is only revealed
   * automatically once `heard` reports `done` and `generating` is falsy.
   */
  generating?: boolean;
  /**
   * Defaults to `true`. `false` reveals the full text at once, for example for a message
   * loaded from history. Read when the hook mounts and when `text` is replaced by a
   * different text, not on every change.
   */
  live?: boolean;
  /**
   * Optional change notifications from the speech progress source. Without it, `heard`
   * is only checked again while the text is paced and its speech is not done, and when
   * `text` or `generating` change. Subscribed once; to switch to another source, remount
   * the component (for example with a `key`).
   */
  subscribe?: HeardTextSubscribe;
};

export type UseHeardTextResult = {
  /** The part of the text the user has heard (the full text when not paced). */
  heardText: string;
  /** `false` when `heard` returned `undefined`; `heardText` is then the full text. */
  isPaced: boolean;
  /** Reveals the full text from now on (e.g. when the user stops the AI response). */
  skip: () => void;
};

type PacingState = {
  /** Number of code points revealed. Never decreases while the text continues. */
  count: number;
  isPaced: boolean;
  /** No more ticking is needed until the inputs change or the source notifies. */
  settled: boolean;
};

/** The reveal of one text. Starts over when the text is replaced by a different text. */
type RevealState = PacingState & {
  /** `live` as read when the reveal started. */
  live: boolean;
  skipped: boolean;
  /** The text `count` refers to. */
  text: string;
};

const now = () =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

const scheduleFrame = (callback: () => void): (() => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
};

/**
 * UTF-16 offsets of the code point boundaries of `text`: `offsets[n]` is the
 * `String.prototype.slice` end index of the first `n` code points, so
 * `offsets.length - 1` is the code point length. Slicing at these offsets never splits
 * a surrogate pair.
 */
const getCodePointOffsets = (text: string): number[] => {
  const offsets = [0];
  let offset = 0;
  for (const codePoint of text) {
    offset += codePoint.length;
    offsets.push(offset);
  }
  return offsets;
};

const sample = ({
  generating,
  heard,
  live,
  previousCount,
  skipped,
  textLength,
}: {
  generating: boolean;
  heard: HeardTextFunction;
  live: boolean;
  previousCount: number;
  skipped: boolean;
  /** Length of the text in code points. */
  textLength: number;
}): PacingState => {
  const progress = heard(now());

  if (!progress) {
    // Not paced: the full text is shown, so pacing that starts later must not move the
    // reveal backwards past what has already been shown.
    return { count: Math.max(previousCount, textLength), isPaced: false, settled: true };
  }

  if (!live || skipped || (progress.done && !generating)) {
    return { count: Math.max(previousCount, textLength), isPaced: true, settled: true };
  }

  // `+Infinity` means the whole text has been heard; NaN, negative and non-numeric
  // counts mean nothing has
  const flooredChars = Math.floor(progress.chars);
  const heardChars = flooredChars > 0 ? flooredChars : 0;

  return {
    count: Math.max(previousCount, Math.min(heardChars, textLength)),
    isPaced: true,
    settled: progress.done,
  };
};

const startReveal = ({
  generating,
  heard,
  live,
  text,
  textLength,
}: {
  generating: boolean;
  heard: HeardTextFunction;
  live: boolean;
  text: string;
  textLength: number;
}): RevealState => ({
  ...sample({ generating, heard, live, previousCount: 0, skipped: false, textLength }),
  live,
  skipped: false,
  text,
});

/**
 * Whether `text` continues the reveal of `previous.text`: it extends or truncates the part
 * already shown. Anything else (the next reply rendered by the same component) is a new
 * text, whose reveal must not start from the length shown for the previous one.
 */
const continuesReveal = (previous: RevealState, text: string) => {
  const offsets = getCodePointOffsets(previous.text);
  const shown = previous.text.slice(
    0,
    offsets[Math.min(previous.count, offsets.length - 1)],
  );
  return text.startsWith(shown) || shown.startsWith(text);
};

const noop = () => undefined;

/**
 * Reveals a text at the pace the user hears it spoken, for example the reply of a voice
 * AI agent that is written into the chat faster than the agent speaks it. The speech
 * progress comes from the app as a plain function, so the hook works with any voice
 * backend and has no dependency on the chat SDK.
 *
 * - Reveals the first `floor(chars)` Unicode code points of `text` (emoji and other
 *   astral characters are never split) and never moves backwards while `text` grows or
 *   is truncated. When `text` is replaced by a different text (the next reply rendered
 *   by the same component), the reveal starts over: the length shown, `skip()` and
 *   `live` are reset.
 * - While the text is paced and its speech is not done, samples `heard` on every
 *   animation frame (a 16 ms timeout without `requestAnimationFrame`). It stops ticking
 *   when the speech is done or the component unmounts; `subscribe` notifications, and
 *   changes of `text` or `generating`, make it check again.
 * - Reveals the full text once `heard` reports `done` and `generating` is falsy, when
 *   `live` is `false`, and after `skip()`.
 * - When `heard` returns `undefined`, `isPaced` is `false` and `heardText` is the full
 *   text. If it becomes paced later, the reveal continues from the length already shown.
 *
 * `heard` and `subscribe` are read through refs, so passing new function identities on
 * every render (inline arrow functions) does not restart the pacing. `subscribe` is
 * called once on mount (and again only if it goes from absent to present) and its
 * unsubscribe function runs on unmount; to switch to another speech source, remount the
 * component. `heard` is also called during render, so keep it free of side effects.
 *
 * @example
 * ```tsx
 * import { useHeardText } from 'stream-chat-react/ai-components';
 *
 * const SpokenReply = ({ generating, session, text, turnId }) => {
 *   const { heardText } = useHeardText({
 *     generating,
 *     heard: (now) => session.speech.heard(turnId, now),
 *     subscribe: (listener) => session.speech.subscribe(listener),
 *     text,
 *   });
 *   return <p>{heardText}</p>;
 * };
 * ```
 */
export const useHeardText = ({
  generating = false,
  heard,
  live = true,
  subscribe,
  text,
}: UseHeardTextParams): UseHeardTextResult => {
  const codePointOffsets = useMemo(() => getCodePointOffsets(text), [text]);
  const textLength = codePointOffsets.length - 1;

  const heardRef = useRef(heard);
  heardRef.current = heard;
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  const [revealState, setRevealState] = useState<RevealState>(() =>
    startReveal({ generating, heard, live, text, textLength }),
  );
  let reveal = revealState;
  if (revealState.text !== text) {
    // Updated during render so that the new text never renders with the previous reveal.
    reveal = continuesReveal(revealState, text)
      ? { ...revealState, count: Math.min(revealState.count, textLength), text }
      : startReveal({ generating, heard, live, text, textLength });
    setRevealState(reveal);
  }
  const revealRef = useRef(reveal);
  revealRef.current = reveal;
  const wakeRef = useRef<() => void>(noop);

  const { live: isLive, skipped } = reveal;

  useEffect(() => {
    let cancelFrame: (() => void) | undefined;
    let disposed = false;

    const tick = () => {
      cancelFrame = undefined;
      if (disposed) return;

      const previous = revealRef.current;
      const next = sample({
        generating,
        heard: heardRef.current,
        live: isLive,
        previousCount: previous.count,
        skipped,
        textLength,
      });

      if (
        next.count !== previous.count ||
        next.isPaced !== previous.isPaced ||
        next.settled !== previous.settled
      ) {
        const updated = { ...previous, ...next };
        revealRef.current = updated;
        setRevealState(updated);
      }

      if (!next.settled) cancelFrame = scheduleFrame(tick);
    };

    wakeRef.current = () => {
      if (!disposed && !cancelFrame) tick();
    };
    tick();

    return () => {
      disposed = true;
      cancelFrame?.();
      wakeRef.current = noop;
    };
  }, [generating, isLive, skipped, text, textLength]);

  const hasSubscribe = Boolean(subscribe);
  useEffect(() => {
    if (!hasSubscribe) return;
    return subscribeRef.current?.(() => wakeRef.current());
  }, [hasSubscribe]);

  const skip = useCallback(
    () => setRevealState((previous) => ({ ...previous, skipped: true })),
    [],
  );

  return {
    heardText: reveal.isPaced
      ? text.slice(0, codePointOffsets[Math.min(reveal.count, textLength)])
      : text,
    isPaced: reveal.isPaced,
    skip,
  };
};
