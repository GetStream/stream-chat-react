import type { ScheduledMessageResponse, StreamChat } from 'stream-chat';

const CID_SEPARATOR = ':';

export const getChannelByCid = (client: StreamChat, cid: string) => {
  const [type, id] = cid.split(CID_SEPARATOR);

  return client.channelManager.get(cid) ?? client.channel(type, id);
};

export const getScheduledMessageChannel = (
  client: StreamChat,
  { cid }: ScheduledMessageResponse,
) => getChannelByCid(client, cid);
