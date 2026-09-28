import { Alert } from '../Dialog';
import { Button } from '../Button';
import React from 'react';
import { useModalContext, useTranslationContext } from '../../context';

export type DeleteMessageAlertProps = {
  onCancel: () => void;
  onDelete: () => void;
};

export const DeleteMessageAlert = ({ onCancel, onDelete }: DeleteMessageAlertProps) => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();

  return (
    <Alert.Root
      className='str-chat__delete-message-alert'
      data-testid='message-delete-alert'
    >
      <Alert.Header
        description={t(
          'messageActions.deleteMessageAlert.description',
          'Are you sure you want to delete this message?',
        )}
        title={t(
          'messageActions.deleteMessageAlert.deleteMessage.title',
          'Delete message',
        )}
      />
      <Alert.Actions>
        <Button
          appearance='outline'
          className='str-chat__delete-message-alert__delete-button'
          data-testid='delete-message-alert-delete-button'
          onClick={onDelete}
          size='md'
          variant='danger'
        >
          {t('messageActions.deleteMessageAlert.deleteMessage.title', 'Delete message')}
        </Button>
        <Button
          appearance='outline'
          autoFocus
          className='str-chat__delete-message-alert__cancel-button'
          data-testid='delete-message-alert-cancel-button'
          onClick={() => {
            onCancel();
            close();
          }}
          size='md'
          variant='secondary'
        >
          {t('common.cancel.label', 'Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
