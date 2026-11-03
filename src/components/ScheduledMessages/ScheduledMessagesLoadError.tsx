import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { Button } from '../Button';
import { ScheduledMessagesEmptyState } from './ScheduledMessagesEmptyState';
import type { ScheduledMessagesLoadErrorProps } from './types';

export const ScheduledMessagesLoadError = ({
  onRetry,
}: ScheduledMessagesLoadErrorProps) => {
  const { t } = useTranslationContext();
  const { IconExclamationMark } = useComponentContextIcons();

  return (
    <ScheduledMessagesEmptyState
      Icon={IconExclamationMark}
      title={t(
        'scheduledMessages.couldntLoadScheduledMessages',
        "Couldn't load scheduled messages",
      )}
    >
      <Button
        appearance='outline'
        className='str-chat__scheduled-messages-empty-list__action'
        onClick={onRetry}
        size='sm'
        variant='secondary'
      >
        {t('scheduledMessages.tryAgain', 'Try again')}
      </Button>
    </ScheduledMessagesEmptyState>
  );
};
