import type { Channel, StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export const getChannel = async <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  type: string,
  id: string,
) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const MAX_QUERY_CHANNELS_LIMIT = 30;

type MoveChannelUpParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  channels: Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>;
  cid: string;
  activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
};

export const moveChannelUp = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  activeChannel,
  channels,
  cid,
}: MoveChannelUpParams<At, Ch, Co, Ev, Me, Re, Us>) => {
  // get channel index
  const channelIndex = channels.findIndex((channel) => channel.cid === cid);

  if (!activeChannel && channelIndex <= 0) return channels;

  // get channel from channels
  const channel = activeChannel || channels[channelIndex];

  // remove channel from current position
  if (channelIndex) channels.splice(channelIndex, 1);
  // add channel at the start
  channels.unshift(channel);

  return [...channels];
};
