import React from 'react';
import { Message } from 'stream-chat';
import { SendIcon } from './icons';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type SendButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => void;
} & React.ComponentProps<'button'>;
export const SendButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  sendMessage,
  ...rest
}: SendButtonProps<StreamChatGenerics>) => (
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
