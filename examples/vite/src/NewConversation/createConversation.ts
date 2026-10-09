import {
  type Channel,
  type ChannelMemberResponse,
  localMessageToNewMessagePayload,
  type StreamChat,
  type UserResponse,
} from 'stream-chat';

export type ConversationDetails = { image?: string; name?: string };

export type OpenedConversation = {
  channel: Channel;
  /** The conversation already existed on the server; the details typed in the dialog were not applied. */
  existed: boolean;
};

const CHANNEL_TYPE = 'messaging';

const withoutEmpty = ({ image, name }: ConversationDetails) => ({
  ...(image ? { image } : {}),
  ...(name?.trim() ? { name: name.trim() } : {}),
});

const ownUser = (client: StreamChat) => client.user as unknown as UserResponse;

/**
 * Keeps a 1:1 that doesn't exist yet local until its first message: nothing is loaded for it (there
 * is nothing on the server yet), and sending the first message creates it on the server (`watch()`)
 * before sending.
 * Its members are shown from the start, the connected user as the one creating it, so the channel
 * reads as one the user is in; the server's members replace them once it is created.
 */
const createOnFirstSend = (
  channel: Channel,
  client: StreamChat,
  others: UserResponse[],
) => {
  const creator = ownUser(client);
  channel.state.members = Object.fromEntries(
    [creator, ...others].map((user) => [
      user.id,
      {
        channel_role: user.id === creator.id ? 'owner' : 'channel_member',
        user,
        user_id: user.id,
      } as ChannelMemberResponse,
    ]),
  );
  channel.messagePaginator.seedFirstPageSync([], channel.messagePaginator.pageSize);
  const { requestHandlers } = channel.configState.getLatestValue();
  channel.configState.partialNext({
    requestHandlers: {
      ...requestHandlers,
      sendMessageRequest: async ({ localMessage, message, options }) => {
        // without an id nothing but its query can be sent, and the query creates it on the server
        if (channel.isProvisional) await channel.watch();
        // another instance may have been stored under the cid meanwhile and taken over from this one
        const response = await (channel.supersededBy ?? channel).sendMessage({
          message: message ?? localMessageToNewMessagePayload(localMessage),
          ...options,
        });
        return { message: response.message };
      },
    },
  });
};

/**
 * A 1:1 conversation is a distinct channel: one per pair of users. One read-only query asks the
 * server for it first, by its exact members, so an existing one opens with its history (it is then
 * the stored instance). Only a conversation that doesn't exist yet is created locally, as a
 * provisional channel: it stays local until the first message, and only then are the name and image
 * applied.
 */
export const openOneToOne = async (
  client: StreamChat,
  other: UserResponse,
  details: ConversationDetails,
  {
    /**
     * Dev switch: `false` skips the lookup, so an existing 1:1 that isn't loaded yet is opened as a
     * local channel. Once that 1:1 is loaded meanwhile (by scrolling the channel list to it, or an
     * event), the server answers the local channel's first query with its cid, and the loaded
     * instance supersedes the local one. A 1:1 already loaded is returned by `ensure` itself.
     */
    lookUpExisting = true,
  }: { lookUpExisting?: boolean } = {},
): Promise<OpenedConversation> => {
  const memberIds = [client.userId as string, other.id];
  const candidates = !lookUpExisting
    ? []
    : await client.queryChannelsAndHydrate(
        {
          filter_conditions: {
            member_count: 2,
            members: { $eq: memberIds },
            type: CHANNEL_TYPE,
          },
          limit: 10,
        },
        {},
      );
  // a 2-member channel created with an id of its own is a group with those two, not their 1:1
  const existing = candidates.find((channel) => channel.id?.startsWith('!members-'));
  if (existing) return { channel: existing, existed: true };

  const channel = client.channelManager.ensure({
    data: {
      custom: withoutEmpty(details),
      members: memberIds.map((user_id) => ({ user_id })),
    },
    type: CHANNEL_TYPE,
  });
  // `ensure` returns a loaded 1:1 with these members rather than a new local channel
  if (!channel.isProvisional) return { channel, existed: true };
  createOnFirstSend(channel, client, [other]);
  return { channel, existed: false };
};

/**
 * A group gets an id of its own: the same people can share several groups ("Project X", "Lunch"),
 * so the members can't identify it. It is created on the server right away, with its members, name
 * and image: with an id, the SDK sends its requests (typing events, drafts) as for any channel, and
 * the server would refuse them for a channel it doesn't have.
 */
export const createGroup = async (
  client: StreamChat,
  others: UserResponse[],
  details: ConversationDetails,
): Promise<OpenedConversation> => {
  const channel = client.channelManager.ensure({
    data: {
      custom: withoutEmpty(details),
      members: [client.userId as string, ...others.map(({ id }) => id)].map(
        (user_id) => ({
          user_id,
        }),
      ),
    },
    id: crypto.randomUUID(),
    type: CHANNEL_TYPE,
  });
  await channel.watch();
  return { channel, existed: false };
};
