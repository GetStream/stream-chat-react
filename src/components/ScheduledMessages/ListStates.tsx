import React from 'react';

import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import {
  ListLoadErrorUI as SharedListLoadErrorUI,
  ListLoadingNextPageUI as SharedListLoadingNextPageUI,
} from '../ListStates';
import type { ListLoadErrorUIProps, ListLoadingNextPageUIProps } from '../ListStates';

const FIRST_PAGE_LOADING_ROW_COUNT = 6;

const loadingRowKeys = Array.from(
  { length: FIRST_PAGE_LOADING_ROW_COUNT },
  (_, index) => `scheduled-message-loading-row-${index}`,
);

const ScheduledMessageLoadingRow = () => (
  <div className='str-chat__scheduled-message-list-loading__row'>
    <div className='str-chat__scheduled-message-list-loading__time' />
    <div className='str-chat__scheduled-message-list-loading__body'>
      <div className='str-chat__scheduled-message-list-loading__avatar' />
      <div className='str-chat__scheduled-message-list-loading__lines'>
        <div className='str-chat__scheduled-message-list-loading__channel-name' />
        <div className='str-chat__scheduled-message-list-loading__text' />
      </div>
    </div>
  </div>
);

export const ScheduledMessageListLoading = () => {
  const { t } = useTranslationContext();

  return (
    <div
      aria-label={t(
        'scheduledMessages.loadingScheduledMessages',
        'Loading scheduled messages',
      )}
      className='str-chat__scheduled-message-list-loading'
      role='status'
    >
      {loadingRowKeys.map((key) => (
        <ScheduledMessageLoadingRow key={key} />
      ))}
    </div>
  );
};

export const ScheduledMessageListEmpty = () => {
  const { t } = useTranslationContext();
  const { IconClock } = useComponentContextIcons();

  return (
    <div className='str-chat__scheduled-messages-empty-list'>
      <IconClock className='str-chat__scheduled-messages-empty-list__icon' />
      <p className='str-chat__scheduled-messages-empty-list__title'>
        {t('scheduledMessages.noScheduledMessages', 'No scheduled messages')}
      </p>
      <p className='str-chat__scheduled-messages-empty-list__description'>
        {t(
          'scheduledMessages.clickTheArrowNextToTheSendButton',
          'Click the arrow next to the send button in a channel to schedule a message.',
        )}
      </p>
    </div>
  );
};

export const ScheduledMessageListEmptySearchResults = () => {
  const { t } = useTranslationContext();
  const { IconSearch } = useComponentContextIcons();

  return (
    <div className='str-chat__scheduled-messages-empty-list'>
      <IconSearch className='str-chat__scheduled-messages-empty-list__icon' />
      <p className='str-chat__scheduled-messages-empty-list__title'>
        {t('scheduledMessages.noMessagesFound', 'No messages found')}
      </p>
    </div>
  );
};

const ScheduledMessageListLoadErrorTitle = () => {
  const { t } = useTranslationContext();

  return (
    <>
      {t(
        'scheduledMessages.couldntLoadScheduledMessages',
        "Couldn't load scheduled messages",
      )}
    </>
  );
};

export const ScheduledMessageListLoadError = (props: ListLoadErrorUIProps) => (
  <SharedListLoadErrorUI
    {...props}
    className='str-chat__scheduled-message-list-load-error'
    Title={ScheduledMessageListLoadErrorTitle}
  />
);

export const ScheduledMessageListFirstPageLoadingUI = () => {
  const { ListFirstPageLoadingUI = ScheduledMessageListLoading } = useComponentContext();

  return <ListFirstPageLoadingUI />;
};

export const ScheduledMessageListEmptyUI = () => {
  const { ListEmptyUI = ScheduledMessageListEmpty } = useComponentContext();

  return <ListEmptyUI />;
};

export const ScheduledMessageListLoadingNextPageUI = (
  props: ListLoadingNextPageUIProps,
) => {
  const { ListLoadingNextPageUI = SharedListLoadingNextPageUI } = useComponentContext();

  return <ListLoadingNextPageUI {...props} />;
};

export const ScheduledMessageListLoadErrorUI = (props: ListLoadErrorUIProps) => {
  const { ListLoadErrorUI = ScheduledMessageListLoadError } = useComponentContext();

  return <ListLoadErrorUI {...props} />;
};
