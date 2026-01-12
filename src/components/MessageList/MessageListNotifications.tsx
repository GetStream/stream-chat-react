import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';
import { useNotifications } from '../Notifications/hooks/useNotifications';
import type { MessageNotificationProps } from './MessageNotification';
import type { ChannelNotifications } from '../../context/ChannelStateContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';
import type { UnreadSnapshotState } from 'stream-chat';

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
          {t('translationBuilderTopic/notification', { notification })}
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
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => ({
  unreadCount: state.unreadCount,
});

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

  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const { messagePaginator } = thread ?? channel;
  const { unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );

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
        {isNotAtLatestMessageSet ? t('Latest Messages') : t('New Messages!')}
      </MessageNotification>
    </div>
  );
};
