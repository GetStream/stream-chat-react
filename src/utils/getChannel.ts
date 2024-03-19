import type {
  Channel,
  ChannelQueryOptions,
  QueryChannelAPIResponse,
  StreamChat,
} from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../types/types';

/**
 * prevent from duplicate invocation of channel.watch()
 * when events 'notification.message_new' and 'notification.added_to_channel' arrive at the same time
 */
const WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL: Record<
  string,
  Promise<QueryChannelAPIResponse> | undefined
> = {};

type GetChannelParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  client: StreamChat<StreamChatGenerics>;
  channel?: Channel<StreamChatGenerics>;
  id?: string;
  members?: string[];
  options?: ChannelQueryOptions<StreamChatGenerics>;
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
export const getChannel = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channel,
  client,
  id,
  members,
  options,
  type,
}: GetChannelParams<StreamChatGenerics>) => {
  if (!channel && !type) {
    throw new Error('Channel or channel type have to be provided to query a channel.');
  }

  // unfortunately typescript is not able to infer that if (!channel && !type) === false, then channel or type has to be truthy
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const theChannel = channel || client.channel(type!, id, { members });

  // need to keep as with call to channel.watch the id can be changed from undefined to an actual ID generated server-side
  const originalCid = theChannel?.id
    ? theChannel.cid
    : members && members.length
    ? generateChannelTempCid(theChannel.type, members)
    : undefined;

  if (!originalCid) {
    throw new Error('Channel ID or channel members array have to be provided to query a channel.');
  }

  const queryPromise = WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];

  if (queryPromise) {
    await queryPromise;
  } else {
    WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid] = theChannel.watch(options);
    await WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
    delete WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[originalCid];
  }

  return theChannel;
};

// Channels created without ID need to be referenced by an identifier until the back-end generates the final ID.
const generateChannelTempCid = (channelType: string, members?: string[]) => {
  if (!members) return;
  const membersStr = [...members].sort().join(',');
  return `${channelType}:!members-${membersStr}`;
};
