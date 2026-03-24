import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, MessageResponse, StreamChat } from 'stream-chat';
import { type ChannelOrResponse, toChannelResponse } from './utils';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: ChannelOrResponse = fromPartial({}),
) => {
  const data = toChannelResponse(channel);
  client.dispatchEvent(
    fromPartial<Event>({
      channel: data,
      cid: data.cid,
      message,
      type: 'message.deleted',
    }),
  );
};
