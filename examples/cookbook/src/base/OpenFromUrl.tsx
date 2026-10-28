import { useEffect } from 'react';
import { useChatContext, useWorkspaceNavigation } from 'stream-chat-react';
import { isDemoChannelId } from './client';

/**
 * `?channel=<id>` opens that channel, and `&thread=<parent message id>` also opens the thread
 * beside it, so a screenshot can start from the exact state its recipe shows.
 */
export const OpenFromUrl = () => {
  const { client } = useChatContext();
  const { openChannel, openThread } = useWorkspaceNavigation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const threadParentId = params.get('thread');
    if (!channelId) return;
    if (!isDemoChannelId(channelId)) {
      console.error(
        `?channel=${channelId} isn't one of the cookbook's channels; not opening it.`,
      );
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const channel = await client.channel('messaging', channelId).watch();
        if (cancelled) return;
        openChannel(channel);
        if (!threadParentId) return;

        // The parent may be older than the first page the channel loaded.
        if (!channel.messagePaginator.getItem(threadParentId)) {
          await channel.messagePaginator.jumpToMessage(threadParentId, {
            suppressFocusSignal: true,
          });
        }
        const message = channel.messagePaginator.getItem(threadParentId);
        if (cancelled) return;
        if (message) openThread({ channel, message });
        else
          console.warn(
            `No message ${threadParentId} in ${channelId} to open a thread from.`,
          );
      } catch (error) {
        console.error(`Couldn't open ${channelId} from the URL`, error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs once: the URL is read on load, and navigation afterwards is the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
