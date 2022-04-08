import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageNotificationProps } from './MessageNotification';

import type { ChannelNotifications } from '../../context/ChannelStateContext';

export type MessageListNotificationsProps = {
  hasNewMessages: boolean;
  isNotAtLatestMessageSet: boolean;
  MessageNotification: React.ComponentType<MessageNotificationProps>;
  notifications: ChannelNotifications;
  scrollToBottom: () => void;
};

export const MessageListNotifications = (props: MessageListNotificationsProps) => {
  const {
    hasNewMessages,
    isNotAtLatestMessageSet,
    MessageNotification,
    notifications,
    scrollToBottom,
  } = props;

  const { t } = useTranslationContext('MessageListNotifications');

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <ConnectionStatus />
      <MessageNotification
        onClick={scrollToBottom}
        showNotification={hasNewMessages || isNotAtLatestMessageSet}
      >
        {isNotAtLatestMessageSet ? t('Latest Messages') : t('New Messages!')}
      </MessageNotification>
    </div>
  );
};
