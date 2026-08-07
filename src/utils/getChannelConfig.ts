import type { Channel, ChannelConfigWithInfo } from 'stream-chat';

/**
 * `channel.getConfig()` throws once the channel is disconnected (current user
 * removed from the channel, channel deleted). Returns `undefined` instead,
 * which is already part of `getConfig()`'s return type.
 */
export const getChannelConfig = (channel: Channel): ChannelConfigWithInfo | undefined =>
  channel.disconnected ? undefined : channel.getConfig();
