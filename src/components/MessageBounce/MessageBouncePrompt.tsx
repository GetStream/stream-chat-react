import React from 'react';
import { useMessageBounceContext, useTranslationContext } from '../../context';

import type { MouseEventHandler, PropsWithChildren } from 'react';

import type { ModalProps } from '../Modal';
import { Button } from '../Button';
import clsx from 'clsx';
import { IconExclamationCircle } from '../Icons';
import { Alert } from '../Dialog';

export type MessageBouncePromptProps = PropsWithChildren<Pick<ModalProps, 'onClose'>>;

// todo: shall we rename this to MessageBounceAlert?
export function MessageBouncePrompt({ children, onClose }: MessageBouncePromptProps) {
  const { handleDelete, handleEdit, handleRetry } = useMessageBounceContext();
  const { t } = useTranslationContext();

  function createHandler(
    handle: MouseEventHandler<HTMLButtonElement>,
  ): MouseEventHandler<HTMLButtonElement> {
    return (e) => {
      handle(e);
      onClose?.(e);
    };
  }

  return (
    <Alert.Root
      className='str-chat__message-bounce-alert'
      data-testid='message-bounce-prompt'
    >
      <Alert.Header
        className='str-chat__message-bounce-alert-header'
        Icon={IconExclamationCircle}
        title={
          !children ? t('This message did not meet our content guidelines') : undefined
        }
      >
        {children}
      </Alert.Header>
      <Alert.Actions className={'str-chat__message-bounce-actions'}>
        <Button
          className={clsx(
            'str-chat__message-bounce-delete',
            'str-chat__button--outline',
            'str-chat__button--destructive',
            'str-chat__button--size-md',
          )}
          data-testid='message-bounce-delete'
          onClick={createHandler(handleDelete)}
        >
          {t('Delete')}
        </Button>
        <Button
          className={clsx(
            'str-chat__message-bounce-edit',
            'str-chat__button--outline',
            'str-chat__button--secondary',
            'str-chat__button--size-md',
          )}
          data-testid='message-bounce-edit'
          onClick={createHandler(handleEdit)}
        >
          {t('Edit Message')}
        </Button>
        <Button
          className={clsx(
            'str-chat__message-bounce-send',
            'str-chat__button--outline',
            'str-chat__button--secondary',
            'str-chat__button--size-md',
          )}
          data-testid='message-bounce-send'
          onClick={createHandler(handleRetry)}
        >
          {t('Send Anyway')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
}
