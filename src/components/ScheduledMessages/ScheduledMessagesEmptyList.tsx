import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';

export const ScheduledMessagesEmptyList = () => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();

  return (
    <div className='str-chat__scheduled-messages-empty-list'>
      <IconClock className='str-chat__scheduled-messages-empty-list__icon' />
      <p className='str-chat__scheduled-messages-empty-list__title'>
        {t('No scheduled messages')}
      </p>
      <p className='str-chat__scheduled-messages-empty-list__description'>
        {t('Messages you schedule appear here')}
      </p>
    </div>
  );
};
