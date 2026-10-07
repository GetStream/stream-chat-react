import {
  type Channel,
  localMessageToNewMessagePayload,
  type StreamChat,
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

/**
 * Keeps a channel local until its first message: nothing is loaded for it (there is nothing on the
 * server yet), and sending the first message creates it on the server (`watch()`) before sending.
 */
const createOnFirstSend = (channel: Channel) => {
  channel.messagePaginator.seedFirstPageSync([], channel.messagePaginator.pageSize);
  const { requestHandlers } = channel.configState.getLatestValue();
  channel.configState.partialNext({
    requestHandlers: {
      ...requestHandlers,
      sendMessageRequest: async ({ localMessage, message, options }) => {
        if (!channel.initialized) await channel.watch();
        const response = await channel.sendMessage({
          message: message ?? localMessageToNewMessagePayload(localMessage),
          ...options,
        });
        return { message: response.message };
      },
    },
  });
};

/**
 * A 1:1 conversation is a distinct channel: one per pair of users, with the id the server derives
 * from the members, so it is known before the channel exists. The channel this session already has
 * is reused, loaded or not; otherwise one read-only query tells whether the server has it (its
 * history then shows right away). Only a conversation that doesn't exist yet stays local until the
 * first message, and only then are the name and image applied.
 */
export const openOneToOne = async (
  client: StreamChat,
  otherUserId: string,
  details: ConversationDetails,
): Promise<OpenedConversation> => {
  const ownUserId = client.userID as string;
  const channel = client.channelManager.ensure({
    type: CHANNEL_TYPE,
    data: {
      custom: withoutEmpty(details),
      members: [{ user_id: ownUserId }, { user_id: otherUserId }],
    },
  });
  if (channel.initialized) return { channel, existed: true };

  const [found] = await client.queryChannelsAndHydrate(
    { filter_conditions: { cid: channel.cid }, limit: 1 },
    {},
  );
  if (found) return { channel: found, existed: true };

  createOnFirstSend(channel);
  return { channel, existed: false };
};

/**
 * A group gets an id of its own: the same people can share several groups ("Project X", "Lunch"),
 * so the members can't identify it. The id is fresh, so there is nothing to look up; the group stays
 * local until the first message creates it with its members, name and image.
 */
export const createGroup = (
  client: StreamChat,
  memberIds: string[],
  details: ConversationDetails,
): OpenedConversation => {
  const ownUserId = client.userID as string;
  const channel = client.channelManager.ensure({
    data: {
      custom: withoutEmpty(details),
      members: [ownUserId, ...memberIds].map((user_id) => ({ user_id })),
    },
    id: crypto.randomUUID(),
    type: CHANNEL_TYPE,
  });
  createOnFirstSend(channel);
  return { channel, existed: false };
};
