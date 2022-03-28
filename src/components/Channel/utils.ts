import type { Dispatch, SetStateAction } from 'react';
import type { ChannelNotifications } from '../../context/ChannelStateContext';
import { v4 as uuidv4 } from 'uuid';

export const makeAddNotifications = (
  setNotifications: Dispatch<SetStateAction<ChannelNotifications>>,
  notificationTimeouts: NodeJS.Timeout[],
) => (text: string, type: 'success' | 'error') => {
  if (typeof text !== 'string' || (type !== 'success' && type !== 'error')) {
    return;
  }

  const id = uuidv4();

  setNotifications((prevNotifications) => [...prevNotifications, { id, text, type }]);

  const timeout = setTimeout(
    () =>
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id),
      ),
    5000,
  );

  notificationTimeouts.push(timeout);
};
