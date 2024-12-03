import { useEffect, useRef, useState } from 'react';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { StreamedMessageTextProps } from '../StreamedMessageText';

export type UseMessageTextStreamingProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  StreamedMessageTextProps<StreamChatGenerics>,
  'streamingLetterIntervalMs' | 'renderingLetterCount'
> & { text: string };

const DEFAULT_LETTER_INTERVAL = 30;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

/**
 * A hook that returns text in a streamed, typewriter fashion. The speed of streaming is
 * configurable.
 * @param {number} [streamingLetterIntervalMs=30] - The timeout between each typing animation in milliseconds.
 * @param {number} [renderingLetterCount=2] - The number of letters to be rendered each time we update.
 * @param {string} text - The text that we want to render in a typewriter fashion.
 * @returns {{ streamedMessageText: string }} - A substring of the text property, up until we've finished rendering the typewriter animation.
 */
export const useMessageTextStreaming = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  streamingLetterIntervalMs = DEFAULT_LETTER_INTERVAL,
  renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
  text,
}: UseMessageTextStreamingProps<StreamChatGenerics>): { streamedMessageText: string } => {
  const [streamedMessageText, setStreamedMessageText] = useState<string>(text);
  const textCursor = useRef<number>(text.length);

  useEffect(() => {
    const textLength = text.length;
    const interval = setInterval(() => {
      if (!text || textCursor.current >= textLength) {
        clearInterval(interval);
      }
      const newCursorValue = textCursor.current + renderingLetterCount;
      const newText = text.substring(0, newCursorValue);
      textCursor.current += newText.length - textCursor.current;
      const codeBlockCounts = (newText.match(/```/g) || []).length;
      const shouldOptimisticallyCloseCodeBlock = codeBlockCounts > 0 && codeBlockCounts % 2 > 0;
      setStreamedMessageText(shouldOptimisticallyCloseCodeBlock ? newText + '```' : newText);
    }, streamingLetterIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [streamingLetterIntervalMs, renderingLetterCount, text]);

  return { streamedMessageText };
};
