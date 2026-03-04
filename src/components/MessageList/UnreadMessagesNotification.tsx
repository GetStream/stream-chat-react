import React from 'react';
import { useChannelStateContext, useTranslationContext } from '../../context';
import { useMessagePaginator } from '../../hooks';
import { Button } from '../Button';
import { IconArrowUp, IconCrossMedium } from '../Icons';
import clsx from 'clsx';
import { useThreadContext } from '../Threads';
import type { UnreadSnapshotState } from 'stream-chat';
import { useStateStore } from '../../store';

export type UnreadMessagesNotificationProps = {
  /**
   * Configuration parameter to determine the message page size, when jumping to the first unread message.
   */
  queryMessageLimit?: number;
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Enabled by default.
   */
  showCount?: boolean;
  // todo: maybe remove?
  unreadCount?: number;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => ({
  unreadCount: state.unreadCount,
});

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  showCount = true,
}: UnreadMessagesNotificationProps) => {
  // todo: move into a hook dedicated to unread count from the snapshot
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();
  const { unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );

  const { t } = useTranslationContext('UnreadMessagesNotification');

  return (
    <div
      className={clsx('str-chat__unread-messages-notification', {
        'str-chat__unread-messages-notification--with-count': unreadCount && showCount,
      })}
      data-testid='unread-messages-notification'
    >
      <Button
        appearance='outline'
        onClick={() =>
          messagePaginator.jumpToTheFirstUnreadMessage({
            pageSize: queryMessageLimit,
          })
        }
        variant='secondary'
      >
        <IconArrowUp />
        {unreadCount && showCount
          ? t('{{count}} unread', { count: unreadCount })
          : t('Unread messages')}
      </Button>
      <Button
        appearance='outline'
        onClick={() => {
          if (thread) {
            void thread.markAsRead();
            return;
          }
          channel.markRead();
        }}
        variant='secondary'
      >
        <IconCrossMedium />
      </Button>
    </div>
  );
};
