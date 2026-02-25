import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';
import { useNotifications } from '../Notifications/hooks/useNotifications';
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
          {t('translationBuilderTopic/notification', { notification })}
        </CustomNotification>
      ))}
    </>
  );
};

export type MessageListNotificationsProps = {
  notifications: ChannelNotifications;
};

export const MessageListNotifications = (props: MessageListNotificationsProps) => {
  const { notifications } = props;

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <ClientNotifications />
      <ConnectionStatus />
    </div>
  );
};
