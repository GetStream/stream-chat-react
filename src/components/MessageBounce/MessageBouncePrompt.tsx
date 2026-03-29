import type { MouseEventHandler } from 'react';
import React from 'react';
import {
  useMessageBounceContext,
  useModalContext,
  useTranslationContext,
} from '../../context';
import { Button } from '../Button';
import { IconExclamationMark } from '../Icons';
import { Alert } from '../Dialog';
import type { PropsWithChildrenOnly } from '../../types/types';

export type MessageBouncePromptProps = PropsWithChildrenOnly;

// todo: shall we rename this to MessageBounceAlert?
export function MessageBouncePrompt({ children }: MessageBouncePromptProps) {
  const { handleDelete, handleEdit, handleRetry } = useMessageBounceContext();
  const { t } = useTranslationContext();
  const { close } = useModalContext();

  function createHandler(
    handle: MouseEventHandler<HTMLButtonElement>,
  ): MouseEventHandler<HTMLButtonElement> {
    return (e) => {
      handle(e);
      close();
    };
  }

  return (
    <Alert.Root
      className='str-chat__message-bounce-alert'
      data-testid='message-bounce-prompt'
    >
      <Alert.Header
        className='str-chat__message-bounce-alert-header'
        Icon={IconExclamationMark}
        title={
          !children ? t('This message did not meet our content guidelines') : undefined
        }
      >
        {children}
      </Alert.Header>
      <Alert.Actions className={'str-chat__message-bounce-actions'}>
        <Button
          appearance='outline'
          className='str-chat__message-bounce-delete'
          data-testid='message-bounce-delete'
          onClick={createHandler(handleDelete)}
          size='md'
          variant='danger'
        >
          {t('Delete')}
        </Button>
        <Button
          appearance='outline'
          className='str-chat__message-bounce-edit'
          data-testid='message-bounce-edit'
          onClick={createHandler(handleEdit)}
          size='md'
          variant='secondary'
        >
          {t('Edit Message')}
        </Button>
        <Button
          appearance='outline'
          className='str-chat__message-bounce-send'
          data-testid='message-bounce-send'
          onClick={createHandler(handleRetry)}
          size='md'
          variant='secondary'
        >
          {t('Send Anyway')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
}
