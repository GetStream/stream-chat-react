import React from 'react';
import { SendIcon } from './icons';
import { useMessageComposerHasSendableData } from './hooks';
import { useTranslationContext } from '../../context';

export type SendButtonProps = {
  sendMessage: (event: React.BaseSyntheticEvent) => void;
} & React.ComponentProps<'button'>;

export const SendButton = ({ sendMessage, ...rest }: SendButtonProps) => {
  const { t } = useTranslationContext();
  const hasSendableData = useMessageComposerHasSendableData();
  return (
    <button
      aria-label={t('aria/Send')}
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
