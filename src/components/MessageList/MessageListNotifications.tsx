import React from 'react';

import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';

import type { ChannelNotifications } from '../../context/ChannelStateContext';

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
      <ConnectionStatus />
    </div>
  );
};
