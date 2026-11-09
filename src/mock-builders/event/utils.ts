import type { Channel, ChannelResponse } from 'stream-chat';

/** A `Channel` instance or a plain `ChannelResponse`. */
export type ChannelOrResponse = Channel | ChannelResponse;

export const toChannelResponse = (channel: ChannelOrResponse): ChannelResponse => {
  // `getClient` exists only on a `Channel` instance, which tells it apart from a `ChannelResponse`.
  if (typeof (channel as Channel).getClient === 'function') {
    const ch = channel as Channel;
    // `channel.data` supplies the remaining fields.
    return {
      ...ch.data,
      cid: ch.cid,
      id: ch.id,
      type: ch.type,
    } as ChannelResponse;
  }
  return channel as ChannelResponse;
};
