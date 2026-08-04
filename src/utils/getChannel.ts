import type {
  Channel,
  ChannelGetOrCreateRequest,
  ChannelStateResponse,
  StreamChat,
  StreamResponse,
} from 'stream-chat';

/**
 * prevent from duplicate invocation of channel.watch()
 * when events 'notification.message_new' and 'notification.added_to_channel' arrive at the same time
 */
const WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL: Record<
  string,
  Promise<StreamResponse<ChannelStateResponse>> | undefined
> = {};

type GetChannelParams = {
  client: StreamChat;
  channel?: Channel;
  id?: string;
  members?: string[];
  options?: ChannelGetOrCreateRequest;
  type?: string;
};
/**
 * Calls channel.watch() if it was not already recently called. Waits for watch promise to resolve even if it was invoked previously.
 * @param client
 * @param members
 * @param options
 * @param type
 * @param id
 * @param channel
 */
export const getChannel = async ({
  channel,
  client,
  id,
  members,
  options,
  type,
}: GetChannelParams) => {
  // Narrow imperatively so `type` is known-defined where we call `client.channel` —
  // TypeScript can't infer from `!channel && !type` alone that `type` is truthy in the
  // `else` path, and this avoids a non-null assertion.
  let theChannel = channel;
  if (!theChannel) {
    if (!type) {
      throw new Error('Channel or channel type have to be provided to query a channel.');
    }
    theChannel = client.channel(type, id, {
      members: members?.map((user_id) => ({ user_id })),
    });
  }

  // need to keep as with call to channel.watch the id can be changed from undefined to an actual ID generated server-side
  const originalCid = theChannel?.id
    ? theChannel.cid
    : members && members.length
      ? generateChannelTempCid(theChannel.type, members)
      : undefined;

  if (!originalCid) {
    throw new Error(
      'Channel ID or channel members array have to be provided to query a channel.',
    );
  }

  const queryPromise = WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];

  if (queryPromise) {
    await queryPromise;
  } else {
    try {
      WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid] = theChannel.watch(options);
      await WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
    } finally {
      delete WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
    }
  }

  return theChannel;
};

// Channels created without ID need to be referenced by an identifier until the back-end generates the final ID.
const generateChannelTempCid = (channelType: string, members?: string[]) => {
  if (!members) return;
  const membersStr = [...members].sort().join(',');
  return `${channelType}:!members-${membersStr}`;
};
