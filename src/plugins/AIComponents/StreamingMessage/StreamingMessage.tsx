import clsx from 'clsx';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useStableCallback } from '../../../utils/useStableCallback';
import { AIMarkdown } from '../AIMarkdown';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type UseMessageTextStreamingProps = {
  /** A fixed pace instead of catching up: the time between each step, in milliseconds. */
  letterIntervalMs?: number;
  /** A fixed pace instead of catching up: the letters written each step. */
  renderingLetterCount?: number;
  text: string;
};

export type StreamingMessageRef = { skipAnimation: () => void };

/**
 * However much of the answer has arrived is written out within this, so the text on screen is
 * never far behind the agent: a long chunk is typed fast, a trickle at the pace it comes.
 */
const CATCH_UP_MS = 400;
/** One frame, the step of the catching-up pace. */
const FRAME_MS = 16;
/** The fixed pace's defaults, when only one of its props is given. */
const DEFAULT_LETTER_INTERVAL_MS = 30;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

/**
 * The part of `text` written so far. Text that grows is typed out from where it was; text
 * there from the start, such as a reply loaded from history, shows at once.
 */
const useTypedText = ({
  letterIntervalMs,
  renderingLetterCount,
  text,
}: UseMessageTextStreamingProps) => {
  const isFixed = letterIntervalMs !== undefined || renderingLetterCount !== undefined;
  const [written, setWritten] = useState(text.length);
  const cursor = useRef(text.length);

  useEffect(() => {
    if (cursor.current > text.length) {
      // The text was replaced by a shorter one: there is nothing past its end to keep.
      cursor.current = text.length;
      setWritten(text.length);
    }
    if (cursor.current >= text.length) return;

    // Catching up sets its pace as text arrives: enough letters a frame to write what is behind
    // in CATCH_UP_MS, and at least one, kept steady until more text comes.
    const step = isFixed
      ? (renderingLetterCount ?? DEFAULT_RENDERING_LETTER_COUNT)
      : Math.max(1, Math.ceil(((text.length - cursor.current) * FRAME_MS) / CATCH_UP_MS));

    const timer = setInterval(
      () => {
        if (cursor.current >= text.length) {
          clearInterval(timer);
          return;
        }
        cursor.current = Math.min(text.length, cursor.current + step);
        setWritten(cursor.current);
      },
      isFixed ? (letterIntervalMs ?? DEFAULT_LETTER_INTERVAL_MS) : FRAME_MS,
    );
    return () => clearInterval(timer);
  }, [isFixed, letterIntervalMs, renderingLetterCount, text]);

  const skipAnimation = useStableCallback(() => {
    cursor.current = text.length;
    setWritten(text.length);
  });

  return { skipAnimation, typedText: text.slice(0, written) } as const;
};

export const StreamingMessage = forwardRef<
  StreamingMessageRef,
  UseMessageTextStreamingProps
>(({ letterIntervalMs, renderingLetterCount, text }, ref) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { skipAnimation, typedText } = useTypedText({
    letterIntervalMs,
    renderingLetterCount,
    text,
  });

  useImperativeHandle(ref, () => ({ skipAnimation }), [skipAnimation]);

  return (
    <ThemeScopeProvider>
      <div className={clsx(themeScopeClassName, 'str-chat__ai-streaming-message')}>
        <AIMarkdown>{typedText}</AIMarkdown>
      </div>
    </ThemeScopeProvider>
  );
});

StreamingMessage.displayName = 'StreamingMessage';
