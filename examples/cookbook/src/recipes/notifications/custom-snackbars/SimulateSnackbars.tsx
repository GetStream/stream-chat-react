import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { publishSnackbars } from './publishSnackbars';

/**
 * Screenshot helper, not part of the recipe. `?simulate=snackbars` publishes the three snackbars
 * `publishSnackbars` does once the page loads, and stops their countdowns from removing them
 * before the shot is taken.
 */
export const SimulateSnackbars = () => {
  const { client } = useChatContext();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('simulate') !== 'snackbars')
      return;

    const ids = publishSnackbars(client);
    // The stack starts each countdown when it shows the snackbar; hold them for the shot.
    const timer = setInterval(
      () => ids.forEach((id) => client.notifications.clearTimeout(id)),
      100,
    );
    return () => {
      clearInterval(timer);
      ids.forEach((id) => client.notifications.remove(id));
    };
  }, [client]);

  return null;
};
