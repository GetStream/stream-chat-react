import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import type { MessageNotificationProps } from './MessageNotification';
import type { ChannelNotifications } from '../../context/ChannelStateContext';

const ClientNotifications = () => {
  const clientNotifications = useNotifications();
  const { t } = useTranslationContext();

  return (
    <>
      {clientNotifications.map((notification) => (
        <CustomNotification
          active={true}
          key={notification.id}
          type={notification.severity}
        >
          {t<string>('translationBuilderTopic/notification', { notification })}
        </CustomNotification>
      ))}
    </>
  );
};

export type MessageListNotificationsProps = {
  hasNewMessages: boolean;
  isMessageListScrolledToBottom: boolean;
  isNotAtLatestMessageSet: boolean;
  MessageNotification: React.ComponentType<MessageNotificationProps>;
  notifications: ChannelNotifications;
  scrollToBottom: () => void;
  threadList?: boolean;
  unreadCount?: number;
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
    unreadCount,
  } = props;

  const { t } = useTranslationContext('MessageListNotifications');

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <ClientNotifications />
      <ConnectionStatus />
      <MessageNotification
        isMessageListScrolledToBottom={isMessageListScrolledToBottom}
        onClick={scrollToBottom}
        showNotification={hasNewMessages || isNotAtLatestMessageSet}
        threadList={threadList}
        unreadCount={unreadCount}
      >
        {isNotAtLatestMessageSet
          ? t<string>('Latest Messages')
          : t<string>('New Messages!')}
      </MessageNotification>
    </div>
  );
};
