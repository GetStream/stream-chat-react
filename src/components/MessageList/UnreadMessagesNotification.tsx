import React from 'react';
import {
  useChannel,
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useMessagePaginator } from '../../hooks';
import { Button } from '../Button';
import clsx from 'clsx';
import { useThreadContext } from '../Threads';
import type { MessagePaginatorState, UnreadSnapshotState } from 'stream-chat';
import { useStateStore } from '../../store';

export type UnreadMessagesNotificationProps = {
  /** Page size used when jumping to the first unread message. */
  queryMessageLimit?: number;
  /** Whether to show the unread count. Defaults to `true`. */
  showCount?: boolean;
  // todo: maybe remove?
  unreadCount?: number;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => ({
  lastReadAt: state.lastReadAt,
  unreadCount: state.unreadCount,
});

const newestLoadedMessageSelector = (state: MessagePaginatorState) => ({
  newestLoadedAt: state.items?.[state.items.length - 1]?.created_at,
});

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  showCount = true,
}: UnreadMessagesNotificationProps) => {
  const { IconArrowDown, IconArrowUp, IconXmark } = useComponentContextIcons();
  // todo: move into a hook dedicated to unread count from the snapshot
  const channel = useChannel();
  const { client } = useChatContext();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();
  const { lastReadAt, unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );
  const { newestLoadedAt } = useStateStore(
    messagePaginator.state,
    newestLoadedMessageSelector,
  );
  // The first unread message is usually above what is on screen. It is below when the loaded window
  // is older than the last read message, e.g. after jumping back in history while new ones arrived.
  const unreadIsBelow =
    lastReadAt != null && newestLoadedAt != null && newestLoadedAt <= lastReadAt;
  const ArrowIcon = unreadIsBelow ? IconArrowDown : IconArrowUp;

  const { t } = useTranslationContext();

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
        <ArrowIcon />
        {unreadCount && showCount
          ? t('messageList.unreadMessagesNotification.unread.text', {
              count: unreadCount,
              defaultValue_one: '{{count}} unread',
              defaultValue_other: '{{count}} unread',
            })
          : t(
              'messageList.unreadMessagesNotification.unreadMessages.text',
              'Unread messages',
            )}
      </Button>
      <Button
        appearance='outline'
        aria-label={t(
          'messageList.unreadMessagesNotification.markMessagesRead.ariaLabel',
          'Mark messages as read',
        )}
        onClick={() => {
          messagePaginator.clearUnreadSnapshot();
          client.messageDeliveryReporter.throttledMarkRead(thread ?? channel);
        }}
        variant='secondary'
      >
        <IconXmark />
      </Button>
    </div>
  );
};
