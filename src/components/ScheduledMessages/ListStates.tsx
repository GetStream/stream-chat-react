import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../context';
import {
  type ListLoadErrorUIProps,
  ListLoadErrorUI as SharedListLoadErrorUI,
} from '../ListStates';
import { ScheduledMessagesEmptyState } from './ScheduledMessagesEmptyState';

// The scheduled message list's own list-state defaults. The list renders the shared
// `List<State>UI` keys while set, else these.

/** The scheduled message list's empty state: "No scheduled messages" and how to schedule one. */
export const ScheduledMessageListEmpty = () => {
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

/** The scheduled message list's error in place of a failed first page. */
export const ScheduledMessageListLoadError = (props: ListLoadErrorUIProps) => (
  <SharedListLoadErrorUI
    {...props}
    className='str-chat__scheduled-message-list-load-error'
    Title={ScheduledMessageListLoadErrorTitle}
  />
);
