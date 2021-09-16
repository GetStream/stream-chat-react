import { useEffect, useState } from 'react';

import { useChatContext, useTranslationContext } from 'stream-chat-react';

import type { MessageListNotificationsProps } from 'stream-chat-react';

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
  const { t } = useTranslationContext();

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
    <CustomNotification active={true} type='error'>
      {t('Connection failure, reconnecting now...')}
    </CustomNotification>
  );
};

export const SocialMessageListNotifications = (props: MessageListNotificationsProps) => {
  const { hasNewMessages, MessageNotification, notifications, scrollToBottom } = props;

  const { t } = useTranslationContext();

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <CustomConnectionStatus />
      <MessageNotification onClick={scrollToBottom} showNotification={hasNewMessages}>
        {t('New Messages!')}
      </MessageNotification>
    </div>
  );
};
