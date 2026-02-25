import React from 'react';
import { useMessageComposerHasSendableData } from './hooks';
import { useTranslationContext } from '../../context';
import { IconPaperPlane } from '../Icons';
import { Button } from '../Button';

export type SendButtonProps = {
  sendMessage: (event: React.BaseSyntheticEvent) => void;
} & React.ComponentProps<'button'>;

export const SendButton = ({ children, sendMessage, ...rest }: SendButtonProps) => {
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
      type='button'
      variant='primary'
      {...rest}
    >
      {children ?? <IconPaperPlane />}
    </Button>
  );
};
