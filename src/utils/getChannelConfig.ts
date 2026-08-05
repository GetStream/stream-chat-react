import type { Channel, ChannelConfigWithInfo } from 'stream-chat';

/**
 * `channel.getConfig()` calls `channel.getClient()`, which throws
 * "You can't use a channel after client.disconnect() was called" once the
 * channel is disconnected (e.g. the current user was removed from the channel
 * or the channel was deleted - see `channel.deleted`,
 * `notification.channel_deleted` and `notification.removed_from_channel`).
 *
 * The `disconnected` flag is flipped from an asynchronous WS event, so there is
 * always a window between the flag becoming true and React unmounting the
 * subtree that renders the channel. Any render inside that window would throw,
 * so callers must never reach `getConfig()` for a disconnected channel.
 *
 * `undefined` is already part of `getConfig()`'s return type, so consumers need
 * no extra handling beyond what they do for a not-yet-configured channel.
 */
export const getChannelConfig = (channel: Channel): ChannelConfigWithInfo | undefined =>
  channel.disconnected ? undefined : channel.getConfig();
