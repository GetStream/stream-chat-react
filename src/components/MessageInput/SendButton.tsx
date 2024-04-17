import React from 'react';
import { Message } from 'stream-chat';
import { useChatContext } from '../../context';
import { SendIconV1, SendIconV2 } from './icons';
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
}: SendButtonProps<StreamChatGenerics>) => {
  const { themeVersion } = useChatContext('SendButton');

  return (
    <button
      aria-label='Send'
      className='str-chat__send-button'
      data-testid='send-button'
      onClick={sendMessage}
      type='button'
      {...rest}
    >
      {themeVersion === '2' ? <SendIconV2 /> : <SendIconV1 />}
    </button>
  );
};
