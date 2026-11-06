import React from 'react';

import { Message } from '../Message/Message';
import type { MessageProps } from '../Message/types';

/**
 * Props of the giphy preview: the message plus the list-wide props every message in the list
 * gets.
 */
export type GiphyPreviewMessageProps = MessageProps;

export const GiphyPreviewMessage = (props: GiphyPreviewMessageProps) => (
  <div className='giphy-preview-message'>
    <Message {...props} />
  </div>
);
