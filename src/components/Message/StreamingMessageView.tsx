import React from 'react';

import { MessageText, MessageTextProps } from './MessageText';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { useMessageContext } from '../../context';
import { useStreamingMessage } from './hooks';

export type StreamingMessageViewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<MessageTextProps<StreamChatGenerics>, 'message' | 'renderText'> & {
  letterInterval?: number;
  renderingLetterCount?: number;
};

export const StreamingMessageView = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: StreamingMessageViewProps<StreamChatGenerics>,
) => {
  const { letterInterval, message: messageFromProps, renderingLetterCount, renderText } = props;
  const { message: messageFromContext } = useMessageContext<StreamChatGenerics>('MessageText');
  const message = messageFromProps || messageFromContext;
  const { text = '' } = message;
  const { streamedMessageText } = useStreamingMessage({
    letterInterval,
    renderingLetterCount,
    text,
  });

  return (
    <MessageText message={{ ...message, text: streamedMessageText }} renderText={renderText} />
  );
};

StreamingMessageView.displayName = 'StreamingMessageView{messageSimple{content}}';
