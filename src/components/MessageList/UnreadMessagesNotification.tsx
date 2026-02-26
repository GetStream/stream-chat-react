import React from 'react';
import { useChannelActionContext, useTranslationContext } from '../../context';
import { Button } from '../Button';
import { IconArrowUp, IconCrossMedium } from '../Icons';
import clsx from 'clsx';

export type UnreadMessagesNotificationProps = {
  /**
   * Configuration parameter to determine the message page size, when jumping to the first unread message.
   */
  queryMessageLimit?: number;
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Enabled by default.
   */
  showCount?: boolean;
  /**
   * The count of unread messages to be displayed if enabled.
   */
  unreadCount?: number;
};

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  showCount = true,
  unreadCount,
}: UnreadMessagesNotificationProps) => {
  const { jumpToFirstUnreadMessage, markRead } = useChannelActionContext();
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
        onClick={() => jumpToFirstUnreadMessage(queryMessageLimit)}
        variant='secondary'
      >
        <IconArrowUp />
        {unreadCount && showCount
          ? t('{{count}} unread', { count: unreadCount })
          : t('Unread messages')}
      </Button>
      <Button appearance='outline' onClick={() => markRead()} variant='secondary'>
        <IconCrossMedium />
      </Button>
    </div>
  );
};
