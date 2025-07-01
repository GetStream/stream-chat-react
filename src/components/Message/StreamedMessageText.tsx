import React from 'react';

import type { MessageTextProps } from './MessageText';
import { MessageText } from './MessageText';

import { useMessageContext } from '../../context';
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
  const message = messageFromProps || messageFromContext;
  const { text = '' } = message;
  const { streamedMessageText } = useMessageTextStreaming({
    renderingLetterCount,
    streamingLetterIntervalMs,
    text,
  });

  return (
    <MessageText
      message={{ ...message, text: streamedMessageText }}
      renderText={renderText}
    />
  );
};
