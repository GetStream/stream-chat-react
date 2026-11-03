import React from 'react';

import { useTranslationContext } from '../../context';
import { SCHEDULED_MESSAGE_LIST_LOADING_ROW_COUNT } from './constants';

const LOADING_ROW_KEYS = Array.from(
  { length: SCHEDULED_MESSAGE_LIST_LOADING_ROW_COUNT },
  (_, index) => `loading-row-${index}`,
);

export const ScheduledMessageListLoading = () => {
  const { t } = useTranslationContext();

  return (
    <div
      aria-busy='true'
      aria-label={t('Loading scheduled messages')}
      className='str-chat__scheduled-message-list-loading'
      data-testid='scheduled-message-list-loading'
      role='status'
    >
      {LOADING_ROW_KEYS.map((key) => (
        <div
          aria-hidden='true'
          className='str-chat__scheduled-message-list-loading__row'
          key={key}
        >
          <div className='str-chat__scheduled-message-list-loading__time' />
          <div className='str-chat__scheduled-message-list-loading__body'>
            <div className='str-chat__scheduled-message-list-loading__avatar' />
            <div className='str-chat__scheduled-message-list-loading__lines'>
              <div className='str-chat__scheduled-message-list-loading__title' />
              <div className='str-chat__scheduled-message-list-loading__subtitle' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
