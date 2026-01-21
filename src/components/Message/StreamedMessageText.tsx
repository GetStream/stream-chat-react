import React, { useEffect } from 'react';

import type { MessageTextProps } from './MessageText';
import { MessageText } from './MessageText';

import { useChannelStateContext, useMessageContext } from '../../context';
import { AIStates, useAIState } from '../AIStateIndicator';
import { useMessageTextStreaming } from './hooks';

export type StreamedMessageTextProps = Pick<
  MessageTextProps,
  'message' | 'renderText'
> & {
  renderingLetterCount?: number;
  streamingLetterIntervalMs?: number;
};

export const StreamedMessageText = (props: StreamedMessageTextProps) => {
  const {
    message: messageFromProps,
    renderingLetterCount,
    renderText,
    streamingLetterIntervalMs,
  } = props;
  const { message: messageFromContext } = useMessageContext('StreamedMessageText');
  const { channel } = useChannelStateContext();
  const { aiState } = useAIState(channel);
  const message = messageFromProps || messageFromContext;
  const { text = '' } = message;
  const { stopGenerating, streamedMessageText } = useMessageTextStreaming({
    renderingLetterCount,
    streamingLetterIntervalMs,
    text,
  });

  useEffect(() => {
    if (aiState === AIStates.Stop) {
      stopGenerating();
    }
  }, [aiState, stopGenerating]);

  return (
    <MessageText
      message={{ ...message, text: streamedMessageText }}
      renderText={renderText}
    />
  );
};
