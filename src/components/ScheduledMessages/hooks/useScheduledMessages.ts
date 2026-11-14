import { useEffect } from 'react';
import type {
  ScheduledMessageResponse,
  ScheduledMessagesView,
  ScheduledMessagesViewState,
} from 'stream-chat';

import { useStateStore } from '../../../store';

const NO_SCHEDULED_MESSAGES: ScheduledMessageResponse[] = [];

const selectItems = ({ items }: ScheduledMessagesViewState) => ({ items });

/**
 * The messages of an SDK scheduled-message view, kept following its paginator while mounted. It
 * loads nothing: `useChannelScheduledMessages` and `useScheduledMessageList` load the list too.
 */
export const useScheduledMessages = (view: ScheduledMessagesView) => {
  useEffect(() => {
    view.registerSubscriptions();
    return () => {
      view.unregisterSubscriptions();
    };
  }, [view]);

  const { items } = useStateStore(view.state, selectItems);
  return { scheduledMessages: items ?? NO_SCHEDULED_MESSAGES };
};
