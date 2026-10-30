import { localMessageToNewMessagePayload } from 'stream-chat';
import type {
  Channel,
  ChannelMemberResponse,
  OperationRequestFn,
  StreamChat,
  UserResponse,
} from 'stream-chat';

/** A two-member channel is their direct conversation if made from its members, or unnamed. */
export const isDirectConversation = (channel: Channel) =>
  !!channel.id?.startsWith('!members-') || !('name' in (channel.data?.custom ?? {}));

/**
 * The user's direct conversation with another user, if they have one (see
 * `isDirectConversation()`). The query only reads: it creates nothing, and it watches what it finds,
 * so the conversation opens with its history and receives events.
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
  return channels.find(isDirectConversation);
};

/**
 * A conversation with `people` that exists only in this client until its first message: a channel
 * created from its members, without an id, so it's provisional (`Channel.isProvisional`). If the
 * client already has a loaded conversation created from exactly these members, `client.channel()`
 * returns that one instead.
 */
export const startLocalConversation = (
  client: StreamChat,
  people: UserResponse[],
  name: string,
): Channel => {
  const channel = client.channel('messaging', {
    // Sent with the query that creates the channel on the first send.
    ...(name ? { custom: { name } } : {}),
    members: [client.userId ?? '', ...people.map(({ id }) => id)].map((user_id) => ({
      user_id,
    })),
  });
  if (!channel.isProvisional || channel.messagePaginator.hasResults) return channel;

  // Nothing is loaded for a channel the server doesn't have yet, so the app fills in what the
  // channel shows until then: its members, the user first, and an empty first page of messages,
  // shorter than a page, so the message list has nothing older to load. The members carry only the
  // user: the server's members replace them when the channel is created.
  const me = client.user as UserResponse;
  channel.state.members = Object.fromEntries(
    [me, ...people].map((user) => [
      user.id,
      { user, user_id: user.id } as ChannelMemberResponse,
    ]),
  );
  channel.messagePaginator.placeExternalQueryPage([], channel.messagePaginator.pageSize);
  return channel;
};

/**
 * Sends the first message of a provisional channel: `Channel.watch()` creates the channel on the
 * server, with its members and name, and resolves with the object to use from then on. That's this
 * one, or the one that superseded it when the client already had the channel under its real cid.
 * Messages in every other channel are sent the usual way.
 */
export const createOnFirstSend =
  (client: StreamChat): OperationRequestFn<'send'> =>
  async (params, defaultRequest) => {
    const channel = client.channelManager.get(params.localMessage.cid);
    if (!channel?.isProvisional) return defaultRequest(params);

    const created = await channel.watch();
    // Shows the new channel in the channel lists whose filters it matches.
    client.channelManager.ingestChannel(created);
    const { message } = await created.sendMessage({
      message: params.message ?? localMessageToNewMessagePayload(params.localMessage),
      ...params.options,
    });
    return { message };
  };
