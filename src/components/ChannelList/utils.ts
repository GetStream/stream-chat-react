import type { Channel, StreamChat } from 'stream-chat';
import uniqBy from 'lodash.uniqby';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const getChannel = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  client: StreamChat<StreamChatGenerics>,
  type: string,
  id: string,
) => {
  const channel = client.channel(type, id);
  await channel.watch();
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
