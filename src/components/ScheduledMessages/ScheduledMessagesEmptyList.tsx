import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ScheduledMessagesEmptyState } from './ScheduledMessagesEmptyState';

export const ScheduledMessagesEmptyList = () => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();

  return (
    <ScheduledMessagesEmptyState
      description={t(
        'scheduledMessages.clickTheArrowNextToTheSendButton',
        'Click the arrow next to the send button in a channel to schedule a message.',
      )}
      Icon={IconClock}
      title={t('scheduledMessages.noScheduledMessages', 'No scheduled messages')}
    />
  );
};
