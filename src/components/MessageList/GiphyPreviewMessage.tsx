import React from 'react';

import { Message } from '../Message/Message';
import type { LocalMessage } from 'stream-chat';

export type GiphyPreviewMessageProps = {
  message: LocalMessage;
};

export const GiphyPreviewMessage = (props: GiphyPreviewMessageProps) => {
  const { message } = props;

  return (
    <div className='giphy-preview-message'>
      <Message message={message} />
    </div>
  );
};
