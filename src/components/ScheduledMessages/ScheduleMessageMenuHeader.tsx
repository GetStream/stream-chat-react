import React from 'react';

import { useTranslationContext } from '../../context';
import { ContextMenuHeader } from '../Dialog';

export const ScheduleMessageMenuHeader = () => {
  const { t } = useTranslationContext();

  return (
    <ContextMenuHeader className='str-chat__schedule-message-menu__header'>
      {t('scheduledMessages.scheduleMessage', 'Schedule message')}
    </ContextMenuHeader>
  );
};
