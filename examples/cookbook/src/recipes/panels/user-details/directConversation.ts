import type { StreamChat } from 'stream-chat';

/**
 * The user's direct conversation with another user, if they have one: a channel with only the two
 * of them and no name of its own. The query only reads: it creates nothing, and it watches what it
 * finds, so the conversation opens with its history and receives events.
 */
export const findDirectConversation = async (client: StreamChat, userId: string) => {
  const channels = await client.queryChannelsAndHydrate({
    // Exactly the two of them: both are members, and there are two members. The server doesn't
    // take `$eq` on `members`.
    filter_conditions: {
      $and: [{ members: { $in: [client.userId ?? ''] } }, { members: { $in: [userId] } }],
      member_count: 2,
      type: 'messaging',
    },
  });
  return channels.find((channel) => !('name' in (channel.data?.custom ?? {})));
};
