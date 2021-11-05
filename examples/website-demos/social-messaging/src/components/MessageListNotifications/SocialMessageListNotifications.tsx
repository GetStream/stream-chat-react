import { useEffect, useState } from 'react';

import { useChatContext } from 'stream-chat-react';
import { MessageListNotificationsProps } from '../../../../../../dist/components/MessageList/MessageListNotifications';

import { ConnectionStatusError } from '../../assets';

import './SocialMessageListNotifications.scss';

type CustomNotificationProps = {
  type: string;
  active?: boolean;
};

const CustomNotification: React.FC<CustomNotificationProps> = (props) => {
  const { active, children, type } = props;

  if (!active) return null;

  return (
    <div
      className={`str-chat__custom-notification notification-${type}`}
      data-testid='custom-notification'
    >
      {children}
    </div>
  );
};

const CustomConnectionStatus: React.FC = () => {
  const { client } = useChatContext();

  const [online, setOnline] = useState(true);

  useEffect(() => {
    const connectionChanged = ({ online: onlineStatus = false }) => {
      if (online !== onlineStatus) {
        setOnline(onlineStatus);
      }
    };

    client.on('connection.changed', connectionChanged);
    return () => client.off('connection.changed', connectionChanged);
  }, [client, online]);

  return (
    <div className={`connection-status ${online ? 'hidden' : ''}`}>
      <div className='connection-status-message'>The Matrix is down!</div>
      <ConnectionStatusError />
    </div>
  );
};

export const SocialMessageListNotifications = (props: MessageListNotificationsProps) => {
  const { hasNewMessages, MessageNotification, notifications, scrollToBottom } = props;

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <CustomConnectionStatus />
      <MessageNotification onClick={scrollToBottom} showNotification={hasNewMessages}>
        New Messages!
      </MessageNotification>
    </div>
  );
};
