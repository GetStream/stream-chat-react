import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';

const CID_SEPARATOR = ':';

export const getScheduledMessageChannel = (
  client: StreamChat,
  { cid }: ScheduledMessageResponse,
) => {
  const [type, id] = cid.split(CID_SEPARATOR);

  const channel = client.channelManager.get(cid) ?? client.channel(type, id);

  return channel;
};
