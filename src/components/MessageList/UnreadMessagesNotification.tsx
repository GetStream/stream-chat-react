import React from 'react';
import { CloseIcon } from './icons';
import { useChannelActionContext, useTranslationContext } from '../../context';

export type UnreadMessagesNotificationProps = {
  /**
   * Configuration parameter to determine the message page size, when jumping to the first unread message.
   */
  queryMessageLimit?: number;
  /**
   * Configuration parameter to determine, whether the unread count is to be shown on the component. Disabled by default.
   */
  showCount?: boolean;
  /**
   * The count of unread messages to be displayed if enabled.
   */
  unreadCount?: number;
};

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  showCount,
  unreadCount,
}: UnreadMessagesNotificationProps) => {
  const { jumpToFirstUnreadMessage, markRead } = useChannelActionContext(
    'UnreadMessagesNotification',
  );
  const { t } = useTranslationContext('UnreadMessagesNotification');

  return (
    <div
      className='str-chat__unread-messages-notification'
      data-testid='unread-messages-notification'
    >
      <button onClick={() => jumpToFirstUnreadMessage(queryMessageLimit)}>
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
