import React from 'react';

import { MessageText, MessageTextProps } from './MessageText';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { useMessageContext } from '../../context';
import { useMessageTextStreaming } from './hooks';

export type StreamedMessageTextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessageTextProps<StreamChatGenerics>, 'message' | 'renderText'> & {
  renderingLetterCount?: number;
  streamingLetterIntervalMs?: number;
};

export const StreamedMessageText = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: StreamedMessageTextProps<StreamChatGenerics>,
) => {
  const {
    message: messageFromProps,
    renderingLetterCount,
    renderText,
    streamingLetterIntervalMs,
  } = props;
  const { message: messageFromContext } =
    useMessageContext<StreamChatGenerics>('StreamedMessageText');
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
