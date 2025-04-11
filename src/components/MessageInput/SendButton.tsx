import React from 'react';
import { SendIcon } from './icons';
import { useComposerHasSendableData } from './hooks';
import type { UpdatedMessage } from 'stream-chat';

export type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
  ) => void;
} & React.ComponentProps<'button'>;
export const SendButton = ({ sendMessage, ...rest }: SendButtonProps) => {
  const hasSendableData = useComposerHasSendableData();
  return (
    <button
      aria-label='Send'
      className='str-chat__send-button'
      data-testid='send-button'
      disabled={!hasSendableData}
      onClick={sendMessage}
      type='button'
      {...rest}
    >
      <SendIcon />
    </button>
  );
};
