import { useEffect } from 'react';
import type { MessageResponse } from 'stream-chat';
import { formatMessage, msToNs, nsToMs } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe: `?system=rename&channel=<id>` adds a system
 * message to that channel's message list on this device, as if the server had sent one. Demo users
 * can't send system messages, so nothing is sent; reloading the page drops it.
 */
export const AddLocalSystemMessage = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    if (params.get('system') !== 'rename' || !channelId) return;

    const channel = client.channel('messaging', channelId);
    // Waits for the channel's first page and its members.
    const timer = setInterval(() => {
      const items = channel.messagePaginator.items;
      const author = channel.state.getLatestValue().members['docs-v15-ck-cara']?.user;
      if (!items?.length || !author) return;
      clearInterval(timer);
      const newest = Math.max(...items.map((item) => item.created_at));
      // A minute after the newest message, so it lands at the end of the list.
      const createdAt = msToNs(nsToMs(newest) + 60_000);
      const message: MessageResponse = {
        attachments: [],
        cid: channel.cid,
        created_at: createdAt,
        custom: {},
        deleted_reply_count: 0,
        html: '',
        id: 'cookbook-local-system-rename',
        latest_reactions: [],
        mentioned_channel: false,
        mentioned_here: false,
        mentioned_users: [],
        own_reactions: [],
        pinned: false,
        reaction_counts: {},
        reaction_scores: {},
        reply_count: 0,
        restricted_visibility: [],
        shadowed: false,
        silent: false,
        text: 'Cara renamed the channel to Weekend trip.',
        type: 'system',
        updated_at: createdAt,
        user: author,
      };
      channel.messagePaginator.ingestItem(formatMessage(message));
    }, 200);

    return () => clearInterval(timer);
  }, [client]);

  return null;
};
