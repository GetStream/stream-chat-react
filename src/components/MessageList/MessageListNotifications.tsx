import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageNotificationProps } from './MessageNotification';

import type { ChannelNotifications } from '../../context/ChannelStateContext';

export type MessageListNotificationsProps = {
  hasNewMessages: boolean;
  isMessageListScrolledToBottom: boolean;
  isNotAtLatestMessageSet: boolean;
  MessageNotification: React.ComponentType<MessageNotificationProps>;
  notifications: ChannelNotifications;
  scrollToBottom: () => void;
  threadList?: boolean;
};

export const MessageListNotifications = (props: MessageListNotificationsProps) => {
  const {
    hasNewMessages,
    isMessageListScrolledToBottom,
    isNotAtLatestMessageSet,
    MessageNotification,
    notifications,
    scrollToBottom,
    threadList,
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
        isMessageListScrolledToBottom={isMessageListScrolledToBottom}
        onClick={scrollToBottom}
        showNotification={hasNewMessages || isNotAtLatestMessageSet}
        threadList={threadList}
      >
        {isNotAtLatestMessageSet ? t<string>('Latest Messages') : t<string>('New Messages!')}
      </MessageNotification>
    </div>
  );
};
