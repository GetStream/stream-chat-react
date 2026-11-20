import React from 'react';

import type { ScheduledMessagesEmptyStateProps } from './types';

export const ScheduledMessagesEmptyState = ({
  children,
  description,
  Icon,
  title,
}: ScheduledMessagesEmptyStateProps) => (
  <div className='str-chat__scheduled-messages-empty-list'>
    <Icon className='str-chat__scheduled-messages-empty-list__icon' />
    <p className='str-chat__scheduled-messages-empty-list__title'>{title}</p>
    {description && (
      <p className='str-chat__scheduled-messages-empty-list__description'>
        {description}
      </p>
    )}
    {children}
  </div>
);
