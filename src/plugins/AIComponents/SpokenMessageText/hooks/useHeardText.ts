import { useEffect, useMemo, useRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

import type { HeardTextFunction } from '../SpokenTextContext';
import { useSpokenTextContext } from '../SpokenTextContext';
import { useStableCallback } from '../../../../utils/useStableCallback';

const DEFAULT_SPOKEN_TEXT_HISTORY_THRESHOLD_MS = 10_000;

export type UseHeardTextParams = {
  /** The message whose text is revealed at the pace it is heard. */
  message: LocalMessage;
  /** The text to reveal. Defaults to `message.text`. */
  text?: string;
};

export type UseHeardTextResult = {
  /** The part of the text the user has heard (the full text when not paced). */
  heardText: string;
  /**
   * `true` when the nearest `SpokenTextProvider` paces this message, i.e. its `heard`
   * function returned a value for it. `false` without a provider or when `heard`
   * returned `undefined`; callers should then fall back to their default rendering.
   */
  isPaced: boolean;
  /** Reveals the full text from now on (e.g. when the user stops the AI response). */
  skip: () => void;
};

type PacingState = {
  /** Number of Unicode code points revealed. Never decreases. */
  count: number;
  isPaced: boolean;
  /** No more ticking is needed until the message, the source or the provider changes. */
  settled: boolean;
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
 * Reads the `generating` custom message field (top-level on stream-chat v9), set by
 * AI backends while the reply text is still being written.
 */
const isMessageGenerating = (message: LocalMessage) =>
  Boolean((message as LocalMessage & { generating?: unknown }).generating);

/**
 * UTF-16 offsets of the code point boundaries of `text`: `offsets[n]` is the
 * `String.prototype.slice` end index of the first `n` code points, so
 * `offsets.length - 1` is the code point length. Slicing at these offsets never
 * splits a surrogate pair.
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

const isHistoryMessage = (message: LocalMessage, thresholdMs: number) => {
  const createdAt = message.created_at ? new Date(message.created_at).getTime() : NaN;
  return Number.isFinite(createdAt) && Date.now() - createdAt > thresholdMs;
};

const sample = ({
  heard,
  isHistory,
  message,
  previousCount,
  skipped,
  textLength,
}: {
  heard: HeardTextFunction | undefined;
  isHistory: boolean;
  message: LocalMessage;
  previousCount: number;
  skipped: boolean;
  /** Length of the text in code points. */
  textLength: number;
}): PacingState => {
  const progress = heard?.(message, now());

  if (!progress) {
    // Not paced: the caller renders the full text, so pacing that starts later must
    // not move the reveal backwards past what has already been shown.
    return {
      count: Math.max(previousCount, textLength),
      isPaced: false,
      settled: true,
    };
  }

  if (isHistory || skipped || (progress.done && !isMessageGenerating(message))) {
    return { count: Math.max(previousCount, textLength), isPaced: true, settled: true };
  }

  const heardChars = Number.isFinite(progress.chars)
    ? Math.max(0, Math.floor(progress.chars))
    : 0;

  return {
    count: Math.max(previousCount, Math.min(heardChars, textLength)),
    isPaced: true,
    settled: progress.done,
  };
};

/**
 * Reveals a message's text at the pace the user hears it, as reported by the nearest
 * `SpokenTextProvider`. While the speech for the message is in progress the hook
 * re-samples the provider's `heard` function on every animation frame (and whenever
 * the provider's `subscribe` source notifies), and stops once the speech is done or
 * the component unmounts. The revealed text never shrinks.
 *
 * `chars` reported by `heard` counts Unicode code points (not UTF-16 code units), so
 * emoji and other astral characters are revealed whole and never split into lone
 * surrogates. The code point boundaries are computed once per text, not per frame.
 *
 * The full text is revealed when:
 * - `heard` reports `done` and the message is no longer generating (`message.generating` is falsy),
 * - the message was created more than `historyThresholdMs` (default 10 s) before mount,
 * - `skip()` was called.
 */
export const useHeardText = ({
  message,
  text: textFromParams,
}: UseHeardTextParams): UseHeardTextResult => {
  const spokenTextContext = useSpokenTextContext();
  const heard = spokenTextContext?.heard;
  const subscribe = spokenTextContext?.subscribe;
  const historyThresholdMs =
    spokenTextContext?.historyThresholdMs ?? DEFAULT_SPOKEN_TEXT_HISTORY_THRESHOLD_MS;
  const text = textFromParams ?? message.text ?? '';
  const codePointOffsets = useMemo(() => getCodePointOffsets(text), [text]);
  const textLength = codePointOffsets.length - 1;

  const [isHistory] = useState(() => isHistoryMessage(message, historyThresholdMs));
  const [skipped, setSkipped] = useState(false);
  const [pacingState, setPacingState] = useState<PacingState>(() =>
    sample({ heard, isHistory, message, previousCount: 0, skipped, textLength }),
  );
  const pacingStateRef = useRef(pacingState);

  useEffect(() => {
    let cancelFrame: (() => void) | undefined;
    let disposed = false;

    const tick = () => {
      cancelFrame = undefined;
      if (disposed) return;

      const previous = pacingStateRef.current;
      const next = sample({
        heard,
        isHistory,
        message,
        previousCount: previous.count,
        skipped,
        textLength,
      });

      if (
        next.count !== previous.count ||
        next.isPaced !== previous.isPaced ||
        next.settled !== previous.settled
      ) {
        pacingStateRef.current = next;
        setPacingState(next);
      }

      if (!next.settled) cancelFrame = scheduleFrame(tick);
    };

    const wake = () => {
      if (!cancelFrame) tick();
    };

    tick();
    const unsubscribe = subscribe?.(wake);

    return () => {
      disposed = true;
      cancelFrame?.();
      unsubscribe?.();
    };
  }, [heard, isHistory, message, skipped, subscribe, textLength]);

  const skip = useStableCallback(() => setSkipped(true));

  return {
    heardText: pacingState.isPaced
      ? text.slice(0, codePointOffsets[Math.min(pacingState.count, textLength)])
      : text,
    isPaced: pacingState.isPaced,
    skip,
  };
};
