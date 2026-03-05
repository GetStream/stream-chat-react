import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import { useTranslationContext } from '../../context/TranslationContext';
import { useNotifications } from '../Notifications/hooks/useNotifications';

export type MessageListNotification = {
  id: string;
  text: string;
  type: 'success' | 'error';
};

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
  notifications?: MessageListNotification[];
};

export const MessageListNotifications = () => (
  <div className='str-chat__list-notifications'>
    <ClientNotifications />
    <ConnectionStatus />
  </div>
);
