import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import { ScheduledMessagesEmptyState } from './ScheduledMessagesEmptyState';

export const ScheduledMessagesEmptyList = () => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();

  return (
    <ScheduledMessagesEmptyState
      description={t('Messages you schedule appear here')}
      Icon={IconClock}
      title={t('No scheduled messages')}
    />
  );
};
