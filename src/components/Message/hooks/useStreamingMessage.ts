import { useEffect, useRef, useState } from 'react';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { StreamedMessageTextProps } from '../StreamedMessageText';

export type UseStreamingMessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  StreamedMessageTextProps<StreamChatGenerics>,
  'streamingLetterIntervalMs' | 'renderingLetterCount'
> & { text: string };

const DEFAULT_LETTER_INTERVAL = 30;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

export const useStreamingMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  streamingLetterIntervalMs = DEFAULT_LETTER_INTERVAL,
  renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
  text,
}: UseStreamingMessageProps<StreamChatGenerics>) => {
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
