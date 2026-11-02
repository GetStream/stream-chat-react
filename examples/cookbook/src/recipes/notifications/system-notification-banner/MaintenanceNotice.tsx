import { useRef } from 'react';
import { Button, useNotificationApi } from 'stream-chat-react';

export const MaintenanceNotice = () => {
  const { addSystemNotification, removeNotification } = useNotificationApi();
  const notificationId = useRef<string | null>(null);

  const show = () => {
    notificationId.current = addSystemNotification({
      // No duration, so it stays until removed.
      duration: 0,
      emitter: 'MaintenanceNotice',
      message: 'Maintenance in 10 minutes',
      severity: 'warning',
      type: 'app:maintenance:upcoming',
    });
  };

  const hide = () => {
    if (notificationId.current) removeNotification(notificationId.current);
    notificationId.current = null;
  };

  return (
    <>
      <Button appearance='outline' onClick={show} size='sm' variant='secondary'>
        Announce maintenance
      </Button>
      <Button appearance='ghost' onClick={hide} size='sm' variant='secondary'>
        Clear notice
      </Button>
    </>
  );
};
