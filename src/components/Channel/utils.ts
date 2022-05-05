import type { Dispatch, SetStateAction } from 'react';
import type { ChannelNotifications } from '../../context/ChannelStateContext';
import { nanoid } from 'nanoid';

export const makeAddNotifications = (
  setNotifications: Dispatch<SetStateAction<ChannelNotifications>>,
  notificationTimeouts: NodeJS.Timeout[],
) => (text: string, type: 'success' | 'error') => {
  if (typeof text !== 'string' || (type !== 'success' && type !== 'error')) {
    return;
  }

  const id = nanoid();

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
