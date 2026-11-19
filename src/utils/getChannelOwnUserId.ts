import type { Channel } from 'stream-chat';

/**
 * The current user of the channel's own client, which can differ from the one in `Chat`. A channel
 * pending disposal is not meant to be rendered and its `getClient()` throws, so a lingering render
 * gets no user instead.
 */
export const getChannelOwnUserId = (channel: Channel) =>
  channel.pendingDisposal ? undefined : channel.getClient().user?.id;
