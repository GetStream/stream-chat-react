import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StreamChat } from 'stream-chat';
import { apiKey, fetchToken } from '../../../base/client';

/**
 * `?simulate=online&online=<user id>,<user id>&channel=<id>` signs those users in, each with a
 * client of its own, and has them watch the channel, for the screenshot of who is online. The app
 * renders once they are connected, so the channel loads with them online and watching.
 */
export const SimulatePresence = ({ children }: PropsWithChildren) => {
  const [params] = useState(() => new URLSearchParams(window.location.search));
  const userIds =
    params.get('simulate') === 'online'
      ? (params.get('online') ?? '').split(',').filter(Boolean)
      : [];
  const [ready, setReady] = useState(!userIds.length);
  const userIdsKey = userIds.join(',');
  const channelId = params.get('channel');

  useEffect(() => {
    const ids = userIdsKey.split(',').filter(Boolean);
    if (!ids.length) return;

    let cancelled = false;
    const others = ids.map(() => new StreamChat(apiKey));
    void Promise.all(
      others.map(async (other, index) => {
        await other.connectUser({ id: ids[index] }, () => fetchToken(ids[index]));
        if (channelId) await other.channel('messaging', channelId).watch();
      }),
    )
      .catch((error) => console.error('Simulated presence failed', error))
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      others.forEach((other) => void other.disconnectUser());
    };
  }, [channelId, userIdsKey]);

  return ready ? <>{children}</> : null;
};
