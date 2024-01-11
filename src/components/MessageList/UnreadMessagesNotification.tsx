import React from 'react';
import { CloseIcon } from './icons';
import { useChannelActionContext, useTranslationContext } from '../../context';

export type UnreadMessagesNotificationProps = {
  firstUnreadMessageId?: string;
  unreadCount?: number;
};

export const UnreadMessagesNotification = ({
  firstUnreadMessageId,
  unreadCount,
}: UnreadMessagesNotificationProps) => {
  const { jumpToMessage, markRead } = useChannelActionContext('UnreadMessagesNotification');
  const { t } = useTranslationContext('UnreadMessagesNotification');

  return (
    <div className='str-chat__unread-messages-notification'>
      <button onClick={() => firstUnreadMessageId && jumpToMessage(firstUnreadMessageId)}>
        {t<string>('{{count}} unread', { count: unreadCount ?? 0 })}
      </button>
      <button onClick={markRead}>
        <CloseIcon />
      </button>
    </div>
  );
};
