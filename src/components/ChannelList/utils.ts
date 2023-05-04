import type { Channel, QueryChannelAPIResponse, StreamChat } from 'stream-chat';
import uniqBy from 'lodash.uniqby';

import type { DefaultStreamChatGenerics } from '../../types/types';

/**
 * prevent from duplicate invocation of channel.watch()
 * when events 'notification.message_new' and 'notification.added_to_channel' arrive at the same time
 */
const WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL: Record<
  string,
  Promise<QueryChannelAPIResponse> | undefined
> = {};

/**
 * Calls channel.watch() if it was not already recently called. Waits for watch promise to resolve even if it was invoked previously.
 * @param client
 * @param type
 * @param id
 */
export const getChannel = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  client: StreamChat<StreamChatGenerics>,
  type: string,
  id: string,
) => {
  const channel = client.channel(type, id);
  const queryPromise = WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[channel.cid];
  if (queryPromise) {
    await queryPromise;
  } else {
    WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[channel.cid] = channel.watch();
    await WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[channel.cid];
    WATCH_QUERY_IN_PROGRESS_FOR_CHANNEL[channel.cid] = undefined;
  }

  return channel;
};

export const MAX_QUERY_CHANNELS_LIMIT = 30;

type MoveChannelUpParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channels: Array<Channel<StreamChatGenerics>>;
  cid: string;
  activeChannel?: Channel<StreamChatGenerics>;
};

export const moveChannelUp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  activeChannel,
  channels,
  cid,
}: MoveChannelUpParams<StreamChatGenerics>) => {
  // get index of channel to move up
  const channelIndex = channels.findIndex((channel) => channel.cid === cid);

  if (!activeChannel && channelIndex <= 0) return channels;

  // get channel to move up
  const channel = activeChannel || channels[channelIndex];

  return uniqBy([channel, ...channels], 'cid');
};
