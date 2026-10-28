import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

/**
 * `?simulate=unread&unread=<channel id>&count=<n>` shows `n` unread messages for the user in that
 * channel, for the screenshot of the unread badge. It changes only this page's copy of the
 * channel's read state, so the shared demo data stays read. Pick a channel that isn't open:
 * opening one marks it read.
 */
export const SimulateUnread = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('unread');
    const count = Number(params.get('count') ?? 1);
    const userId = client.userId;
    if (params.get('simulate') !== 'unread' || !channelId || !userId) return;

    // The channel list loads this same instance, so the change shows in its row.
    const channel = client.channel('messaging', channelId);
    // Re-applied whenever the read state changes, because the channel's query writes it on load.
    return channel.state.subscribeWithSelector(
      ({ read }) => ({ ownRead: read[userId] }),
      ({ ownRead }) => {
        if (!ownRead || ownRead.unread_messages === count) return;
        channel.state.read = {
          ...channel.state.read,
          [userId]: { ...ownRead, unread_messages: count },
        };
      },
    );
  }, [client]);

  return null;
};
