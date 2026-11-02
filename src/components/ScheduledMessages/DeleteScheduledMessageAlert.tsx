import React from 'react';

import { useTranslationContext } from '../../context';
import { Button } from '../Button';
import { Alert } from '../Dialog';
import type { DeleteScheduledMessageAlertProps } from './types';

export const DeleteScheduledMessageAlert = ({
  onCancel,
  onDelete,
}: DeleteScheduledMessageAlertProps) => {
  const { t } = useTranslationContext();

  return (
    <Alert.Root
      className='str-chat__delete-scheduled-message-alert'
      data-testid='delete-scheduled-message-alert'
    >
      <Alert.Header
        description={t("This message won't be sent.")}
        title={t('Delete scheduled message')}
      />
      <Alert.Actions>
        <Button
          appearance='outline'
          className='str-chat__delete-scheduled-message-alert__delete-button'
          onClick={onDelete}
          size='md'
          variant='danger'
        >
          {t('Delete')}
        </Button>
        <Button
          appearance='outline'
          autoFocus
          className='str-chat__delete-scheduled-message-alert__cancel-button'
          onClick={onCancel}
          size='md'
          variant='secondary'
        >
          {t('Cancel')}
        </Button>
      </Alert.Actions>
    </Alert.Root>
  );
};
