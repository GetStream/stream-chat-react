import React from 'react';
import { CloseIcon } from './icons';
import { useChannelActionContext, useTranslationContext } from '../../context';

export type UnreadMessagesNotificationProps = {
  queryMessageLimit?: number;
  unreadCount?: number;
};

export const UnreadMessagesNotification = ({
  queryMessageLimit,
  unreadCount,
}: UnreadMessagesNotificationProps) => {
  const { jumpToFirstUnreadMessage, markRead } = useChannelActionContext(
    'UnreadMessagesNotification',
  );
  const { t } = useTranslationContext('UnreadMessagesNotification');

  return (
    <div className='str-chat__unread-messages-notification'>
      <button onClick={() => jumpToFirstUnreadMessage(queryMessageLimit)}>
        {t<string>('{{count}} unread', { count: unreadCount ?? 0 })}
      </button>
      <button onClick={markRead}>
        <CloseIcon />
      </button>
    </div>
  );
};
