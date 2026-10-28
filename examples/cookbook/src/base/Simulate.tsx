import { useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import { apiKey, fetchToken, isDemoChannelId } from './client';

/**
 * `?simulate=typing&as=<user id>&channel=<id>` signs in a second user in the page and keeps them
 * typing in the channel, for screenshots of typing indicators. A second client is needed because a
 * user never sees their own typing.
 */
export const Simulate = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('as');
    const channelId = params.get('channel');
    if (params.get('simulate') !== 'typing' || !userId || !isDemoChannelId(channelId))
      return;

    const other = new StreamChat(apiKey);
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    void (async () => {
      try {
        await other.connectUser({ id: userId }, () => fetchToken(userId));
        if (cancelled) return;
        const channel = await other.channel('messaging', channelId).watch();
        if (cancelled) return;
        // `keystroke()` sends typing.start and is throttled by the SDK, so repeating it keeps
        // the indicator up for as long as the page is open.
        await channel.keystroke();
        timer = setInterval(() => void channel.keystroke(), 2000);
      } catch (error) {
        console.error('Simulated typing failed', error);
      }
    })();

    // Cleanup can run while the client is still connecting (StrictMode does that on purpose); the
    // `cancelled` checks above stop the rest, and disconnecting here closes whatever was opened.
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      void other.disconnectUser();
    };
  }, []);

  return null;
};
