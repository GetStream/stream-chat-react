import React from 'react';

import { Message } from '../Message/Message';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type GiphyPreviewMessageProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  message: StreamMessage<StreamChatGenerics>;
};

export const GiphyPreviewMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: GiphyPreviewMessageProps<StreamChatGenerics>,
) => {
  const { message } = props;

  return (
    <div className='giphy-preview-message'>
      <Message message={message} />
    </div>
  );
};
