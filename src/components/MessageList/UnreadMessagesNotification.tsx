import React from 'react';
import { useChannel, useChatContext, useTranslationContext } from '../../context';
import { useMessagePaginator } from '../../hooks';
import { Button } from '../Button';
import { IconArrowUp, IconXmark } from '../Icons';
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
  const channel = useChannel();
  const { client } = useChatContext();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();
  const { unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );

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
        <IconArrowUp />
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
