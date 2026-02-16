import React from 'react';
import { useMessageComposerHasSendableData } from './hooks';
import type { UpdatedMessage } from 'stream-chat';
import { useTranslationContext } from '../../context';
import { IconPaperPlane } from '../Icons';
import { Button } from '../Button';
import clsx from 'clsx';

export type SendButtonProps = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Omit<UpdatedMessage, 'mentioned_users'>,
  ) => void;
} & React.ComponentProps<'button'>;

export const SendButton = ({ children, sendMessage, ...rest }: SendButtonProps) => {
  const { t } = useTranslationContext();
  const hasSendableData = useMessageComposerHasSendableData();
  return (
    <Button
      aria-label={t('aria/Send')}
      className={clsx(
        'str-chat__send-button',
        'str-chat__button--solid',
        'str-chat__button--primary',
        'str-chat__button--size-sm',
        'str-chat__button--circular',
      )}
      data-testid='send-button'
      disabled={!hasSendableData}
      onClick={sendMessage}
      type='button'
      {...rest}
    >
      {children ?? <IconPaperPlane />}
    </Button>
  );
};
