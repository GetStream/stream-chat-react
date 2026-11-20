import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ScheduledMessagesEmptyState } from './ScheduledMessagesEmptyState';

export const ScheduledMessagesNoResults = () => {
  const { t } = useTranslationContext();
  const { IconSearch } = useComponentContextIcons();

  return (
    <ScheduledMessagesEmptyState
      Icon={IconSearch}
      title={t('scheduledMessages.noMessagesFound', 'No messages found')}
    />
  );
};
