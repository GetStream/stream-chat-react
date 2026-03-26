import type { Channel, ChannelResponse } from 'stream-chat';

/**
 * Accepts either a Channel instance or a plain ChannelResponse object.
 * Extracts a ChannelResponse from whichever is passed.
 */
export type ChannelOrResponse = Channel | ChannelResponse;

export const toChannelResponse = (channel: ChannelOrResponse): ChannelResponse => {
  if (typeof (channel as Channel).getConfig === 'function') {
    const ch = channel as Channel;
    // Build a ChannelResponse-like object from Channel instance properties,
    // falling back to channel.data for additional fields
    return {
      ...ch.data,
      cid: ch.cid,
      id: ch.id,
      type: ch.type,
    } as ChannelResponse;
  }
  return channel as ChannelResponse;
};
