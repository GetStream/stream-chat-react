import React from 'react';

import { Message } from '../Message/Message';

import type { StreamMessage } from '../../context/ChannelStateContext';

export type GiphyPreviewMessageProps = {
  message: StreamMessage;
};

export const GiphyPreviewMessage = (props: GiphyPreviewMessageProps) => {
  const { message } = props;

  return (
    <div className='giphy-preview-message'>
      <Message message={message} />
    </div>
  );
};
