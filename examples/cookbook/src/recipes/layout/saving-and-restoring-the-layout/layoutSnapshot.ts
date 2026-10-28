import type { Channel as StreamChannel, StreamChat } from 'stream-chat';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
} from 'stream-chat-react/slot-layout';
import type {
  DeserializeLayoutEntityBinding,
  SerializeLayoutEntityBinding,
} from 'stream-chat-react/slot-layout';

// The client's object for the channel with this cid, or nothing for an invalid cid.
export const channelFromCid = (
  client: StreamChat,
  cid: string,
): StreamChannel | undefined => {
  const [type, id] = cid.split(':');
  return type && id ? client.channel(type, id) : undefined;
};

// A channel is saved as its cid. Threads, and anything else, are left out.
export const serializeEntityBinding: SerializeLayoutEntityBinding = (binding) => {
  const entity = getChatViewEntityBinding(binding);
  if (entity?.kind !== 'channel') return undefined;
  return { key: binding.key, payload: { cid: entity.source.cid } };
};

// A saved cid becomes the client's channel object again. Nothing is loaded here.
export const createDeserializer =
  (client: StreamChat): DeserializeLayoutEntityBinding =>
  (saved) => {
    const { cid } = saved.payload as { cid?: string };
    const channel = cid ? channelFromCid(client, cid) : undefined;
    if (!channel) return undefined;
    return createChatViewSlotBinding({
      key: channel.cid,
      kind: 'channel',
      source: channel,
    });
  };
