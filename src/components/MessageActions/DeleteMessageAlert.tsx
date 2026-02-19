import { Alert } from '../Dialog';
import { Button } from '../Button';
import clsx from 'clsx';
import React from 'react';
import { useTranslationContext } from '../../context';
import type { ModalProps } from '../Modal';

export type DeleteMessageAlertProps = Pick<ModalProps, 'onClose'> & {
  onDelete: () => void;
};

export const DeleteMessageAlert = ({ onClose, onDelete }: DeleteMessageAlertProps) => {
  const { t } = useTranslationContext();
  return (
    <Alert.Root
      className='str-chat__delete-message-alert'
      data-testid='message-delete-alert'
    >
      <Alert.Header
        description={t('Are you sure you want to delete this message?')}
        title={t('Delete message')}
      />
      <Alert.Actions>
        <Button
          className={clsx(
            'str-chat__delete-message-alert__delete-button',
            'str-chat__button--outline',
            'str-chat__button--destructive',
            'str-chat__button--size-md',
          )}
          data-testid='delete-message-alert-delete-button'
          onClick={onDelete}
        >
          {t('Delete message')}
        </Button>
        <Button
          className={clsx(
            'str-chat__delete-message-alert__cancel-button',
            'str-chat__button--outline',
            'str-chat__button--secondary',
            'str-chat__button--size-md',
          )}
          data-testid='delete-message-alert-cancel-button'
          onClick={onClose}
        >
          {t('Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
