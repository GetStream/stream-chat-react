import React from 'react';

import { useTranslationContext } from '../../context';
import { Button } from '../Button';
import { Alert } from '../Dialog';
import type { DeleteScheduledMessageAlertProps } from './types';

export const DeleteScheduledMessageAlert = ({
  channelName,
  onCancel,
  onDelete,
}: DeleteScheduledMessageAlertProps) => {
  const { t } = useTranslationContext();

  const description = channelName
    ? t(
        'scheduledMessages.thisMessageToNameWontBeSentThis',
        "This message to {{ name }} won't be sent. This can't be undone.",
        {
          name: channelName,
        },
      )
    : t(
        'scheduledMessages.thisMessageWontBeSentThisCantBe',
        "This message won't be sent. This can't be undone.",
      );

  return (
    <Alert.Root
      className='str-chat__delete-scheduled-message-alert'
      data-testid='delete-scheduled-message-alert'
    >
      <Alert.Header
        description={description}
        title={t('scheduledMessages.deleteScheduledMessage', 'Delete scheduled message?')}
      />
      <Alert.Actions>
        <Button
          appearance='solid'
          className='str-chat__delete-scheduled-message-alert__delete-button'
          onClick={onDelete}
          size='md'
          variant='danger'
        >
          {t('scheduledMessages.delete', 'Delete')}
        </Button>
        <Button
          appearance='outline'
          autoFocus
          className='str-chat__delete-scheduled-message-alert__cancel-button'
          onClick={onCancel}
          size='md'
          variant='secondary'
        >
          {t('scheduledMessages.cancel', 'Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
