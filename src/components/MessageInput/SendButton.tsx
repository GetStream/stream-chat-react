import React from 'react';
import { SendIcon } from './icons';
import type { UpdatedMessage } from 'stream-chat';

export type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
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
