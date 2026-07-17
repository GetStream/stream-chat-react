import React from 'react';
import { useMessageComposerHasSendableData } from './hooks';
import { useComponentContext, useTranslationContext } from '../../context';
import { IconSend as DefaultIconSend } from '../Icons';
import { Button } from '../Button';

export type SendButtonProps = {
  sendMessage: (event: React.BaseSyntheticEvent) => void;
} & React.ComponentProps<'button'>;

export const SendButton = ({ children, sendMessage, ...rest }: SendButtonProps) => {
  const { icons: { IconSend = DefaultIconSend } = {} } = useComponentContext();

  const { t } = useTranslationContext();
  const hasSendableData = useMessageComposerHasSendableData();
  return (
    <Button
      appearance='solid'
      aria-label={t('aria/Send')}
      circular
      className='str-chat__send-button'
      data-testid='send-button'
      disabled={!hasSendableData}
      onClick={sendMessage}
      size='sm'
      variant='primary'
      {...rest}
    >
      {children ?? <IconSend />}
    </Button>
  );
};
