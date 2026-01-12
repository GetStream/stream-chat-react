import React from 'react';
import { CloseIcon } from './icons';
import {
  useChannelActionContext,
  useChannelStateContext,
  useTranslationContext,
} from '../../context';
import { useThreadContext } from '../Threads';
import type { UnreadSnapshotState } from 'stream-chat';
import { useStateStore } from '../../store';

export type UnreadMessagesNotificationProps = {
  /**
   * Configuration parameter to determine the message page size, when jumping to the first unread message.
   */
  queryMessageLimit?: number;
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Disabled by default.
   */
  showCount?: boolean;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => ({
  unreadCount: state.unreadCount,
});

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  showCount,
}: UnreadMessagesNotificationProps) => {
  // todo: move into a hook dedicated to unread count from the snapshot
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const { messagePaginator } = thread ?? channel;
  const { unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );

  const { markRead } = useChannelActionContext('UnreadMessagesNotification');
  const { t } = useTranslationContext('UnreadMessagesNotification');

  return (
    <div
      className='str-chat__unread-messages-notification'
      data-testid='unread-messages-notification'
    >
      <button
        onClick={() =>
          channel.messagePaginator.jumpToTheFirstUnreadMessage({
            pageSize: queryMessageLimit,
          })
        }
      >
        {unreadCount && showCount
          ? t('{{count}} unread', { count: unreadCount ?? 0 })
          : t('Unread messages')}
      </button>
      <button onClick={() => markRead()}>
        <CloseIcon />
      </button>
    </div>
  );
};
