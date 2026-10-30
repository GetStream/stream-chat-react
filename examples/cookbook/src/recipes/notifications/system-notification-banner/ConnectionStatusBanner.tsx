import type { Notification } from 'stream-chat';
import { useSystemNotifications } from 'stream-chat-react';
import './ConnectionStatusBanner.css';

const isConnectionLost = (notification: Notification) =>
  notification.type === 'system:network:connection:lost';

export const ConnectionStatusBanner = () => {
  const [notification] = useSystemNotifications({ filter: isConnectionLost });

  // The status region stays rendered, so screen readers announce the text when it appears.
  return (
    <div role='status'>
      {notification && (
        <div className='cookbook-connection-status'>{notification.message}</div>
      )}
    </div>
  );
};
