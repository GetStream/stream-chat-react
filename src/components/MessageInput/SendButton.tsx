import React from 'react';
import type { Message } from 'stream-chat';
import { SendIcon } from './icons';

export type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message>,
  ) => void;
} & React.ComponentProps<'button'>;
export const SendButton = ({ sendMessage, ...rest }: SendButtonProps) => (
  <button
    aria-label='Send'
    className='str-chat__send-button'
    data-testid='send-button'
    onClick={sendMessage}
    type='button'
    {...rest}
  >
    <SendIcon />
  </button>
);
