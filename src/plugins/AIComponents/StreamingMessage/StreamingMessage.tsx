import React, { forwardRef, useImperativeHandle } from 'react';

import { useMessageTextStreaming } from '../../../components/Message/hooks';
import { AIMarkdown } from '../AIMarkdown';

export type UseMessageTextStreamingProps = {
  letterIntervalMs?: number;
  renderingLetterCount?: number;
  text: string;
};

export type StreamingMessageRef = { skipAnimation: () => void };

export const StreamingMessage = forwardRef<
  StreamingMessageRef,
  UseMessageTextStreamingProps
>(({ letterIntervalMs, renderingLetterCount, text }, ref) => {
  const { skipAnimation, streamedMessageText } = useMessageTextStreaming({
    renderingLetterCount,
    streamingLetterIntervalMs: letterIntervalMs,
    text,
  });

  useImperativeHandle(ref, () => ({ skipAnimation }), [skipAnimation]);

  return (
    <div className='str-chat__ai-streaming-message'>
      <AIMarkdown>{streamedMessageText}</AIMarkdown>
    </div>
  );
});

StreamingMessage.displayName = 'StreamingMessage';
