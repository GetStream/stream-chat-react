import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';

import { AIMarkdown } from './ai-markdown';
import { useStableCallback } from '../hooks/use-stable-callback';

export type UseMessageTextStreamingProps = {
  letterIntervalMs?: number;
  renderingLetterCount?: number;
  text: string;
};

const DEFAULT_LETTER_INTERVAL = 30;
const DEFAULT_RENDERING_LETTER_COUNT = 2;

/**
 * A hook that returns text in a streamed, typewriter fashion. The speed of streaming is
 * configurable.
 * @param {number} [letterIntervalMs=30] - The timeout between each typing animation in milliseconds.
 * @param {number} [renderingLetterCount=2] - The number of letters to be rendered each time we update.
 * @param {string} text - The text that we want to render in a typewriter fashion.
 * @returns {{ streamedMessageText: string, skipAnimation: () => void }} - A substring of the text property, up until we've finished rendering the typewriter animation. Also returns a method to skip the animation and render the full current text immediately.
 */
export const useMessageTextStreaming = ({
  renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
  letterIntervalMs = DEFAULT_LETTER_INTERVAL,
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
    }, letterIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [letterIntervalMs, renderingLetterCount, text]);

  /**
   * A method to skip the typewriter animation and render the full current text immediately.
   */
  const skipAnimation = useStableCallback(() => {
    textCursor.current = text.length;
    setStreamedMessageText(text);
  });

  return { streamedMessageText, skipAnimation } as const;
};

export type StreamingMessageRef = Pick<
  ReturnType<typeof useMessageTextStreaming>,
  'skipAnimation'
>;

export const StreamingMessage = forwardRef<
  StreamingMessageRef,
  { text: string } & UseMessageTextStreamingProps
>(
  (
    {
      text,
      renderingLetterCount = DEFAULT_RENDERING_LETTER_COUNT,
      letterIntervalMs = DEFAULT_LETTER_INTERVAL,
    },
    ref,
  ) => {
    const { streamedMessageText, skipAnimation } = useMessageTextStreaming({
      text,
      renderingLetterCount,
      letterIntervalMs,
    });

    useImperativeHandle(ref, () => ({
      skipAnimation,
    }));

    return (
      <div className="aicr__streaming-message">
        <AIMarkdown>{streamedMessageText}</AIMarkdown>
      </div>
    );
  },
);
