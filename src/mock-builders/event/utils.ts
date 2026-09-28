import type { Channel, ChannelResponse } from 'stream-chat';

/**
 * Accepts either a Channel instance or a plain ChannelResponse object.
 * Extracts a ChannelResponse from whichever is passed.
 */
export type ChannelOrResponse = Channel | ChannelResponse;

export const toChannelResponse = (channel: ChannelOrResponse): ChannelResponse => {
  // Duck-types a `Channel` instance apart from a `ChannelResponse`. Used to key on `getConfig`, which
  // no longer exists; `getClient` is the equivalent instance-only method.
  if (typeof (channel as Channel).getClient === 'function') {
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
