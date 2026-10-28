import { useEffect } from 'react';
import { useChatContext, useNotificationApi } from 'stream-chat-react';

/**
 * Screenshot helper, not part of the recipe. `?simulate=offline` reports the device network as
 * down once the app has loaded, so `Chat` publishes its lost-connection notification; `?simulate=maintenance` publishes
 * the notice `MaintenanceNotice` would, without a click.
 */
export const SimulateSystemNotification = () => {
  const { client } = useChatContext();
  const { addSystemNotification, removeNotification } = useNotificationApi();

  useEffect(() => {
    const simulate = new URLSearchParams(window.location.search).get('simulate');
    if (simulate === 'offline') {
      // Goes offline once the channel list and the open channel have loaded, so the shot shows
      // the app around the banner.
      const channelId = new URLSearchParams(window.location.search).get('channel');
      const hasLoaded = () =>
        client.channelManager.paginators.some(
          (paginator) => paginator.state.getLatestValue().items?.length,
        ) &&
        (!channelId ||
          !!client.channel('messaging', channelId).messagePaginator.items?.length);
      const timer = setInterval(() => {
        if (!hasLoaded()) return;
        clearInterval(timer);
        client.networkConnection.setStatus(false);
      }, 200);
      return () => clearInterval(timer);
    }
    if (simulate !== 'maintenance') return;

    const id = addSystemNotification({
      duration: 0,
      emitter: 'MaintenanceNotice',
      message: 'Maintenance in 10 minutes',
      severity: 'warning',
      type: 'app:maintenance:upcoming',
    });
    return () => removeNotification(id);
  }, [addSystemNotification, client, removeNotification]);

  return null;
};
