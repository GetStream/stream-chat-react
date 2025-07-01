import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { Notification, NotificationManagerState } from 'stream-chat';

const selector = (state: NotificationManagerState) => ({
  notifications: state.notifications,
});

export const useNotifications = (): Notification[] => {
  const { client } = useChatContext();
  const result = useStateStore(client.notifications.store, selector);
  return result.notifications;
};
