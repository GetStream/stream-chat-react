import { useEffect, useRef, useState } from 'react';

import { useStableCallback } from '../../../utils/useStableCallback';
import type { StreamedMessageTextProps } from '../StreamedMessageText';

export type UseMessageTextStreamingProps = Pick<
  StreamedMessageTextProps,
  'streamingLetterIntervalMs' | 'renderingLetterCount'
> & { text: string };

const DEFAULT_LETTER_INTERVAL = 30;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

/**
 * Reveals `text` in a typewriter fashion as it grows. The text present on mount shows at once.
 *
 * @param params.streamingLetterIntervalMs - Delay in ms between reveal steps. Defaults to 30.
 * @param params.renderingLetterCount - Number of letters revealed per step. Defaults to 2.
 * @param params.text - Full text to reveal.
 * @returns `streamedMessageText`, the part of `text` revealed so far, and `skipAnimation`, which
 * reveals all of it at once.
 */
export const useMessageTextStreaming = ({
  renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
  streamingLetterIntervalMs = DEFAULT_LETTER_INTERVAL,
  text,
}: UseMessageTextStreamingProps) => {
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(text.length);

  useEffect(() => {
    const textLength = text.length;

    const interval = setInterval(() => {
      if (!text || textCursor.current >= textLength) {
        clearInterval(interval);
        return;
      }
      const newCursorValue = textCursor.current + renderingLetterCount;
      const newText = text.substring(0, newCursorValue);
      textCursor.current += newText.length - textCursor.current;
      setStreamedMessageText(newText);
    }, streamingLetterIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [streamingLetterIntervalMs, renderingLetterCount, text]);

  const skipAnimation = useStableCallback(() => {
    textCursor.current = text.length;
    setStreamedMessageText(text);
  });

  return { skipAnimation, streamedMessageText } as const;
};
