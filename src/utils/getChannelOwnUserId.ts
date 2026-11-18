import type { Channel } from 'stream-chat';

/**
 * The current user of the channel's own client, which can differ from the one in `Chat`. A channel
 * pending disposal no longer gives out its client, so its own membership names the user; without
 * one, the user is unknown rather than another client's.
 */
export const getChannelOwnUserId = (channel: Channel) =>
  channel.pendingDisposal
    ? (channel.state.membership?.user?.id ?? channel.state.membership?.user_id)
    : channel.getClient().user?.id;
