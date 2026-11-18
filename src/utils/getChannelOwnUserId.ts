import type { Channel, StreamChat } from 'stream-chat';

/**
 * The current user of the channel's own client, which can differ from the one in `Chat`. A channel
 * pending disposal no longer gives out its client, so `chatClient`'s user stands in.
 */
export const getChannelOwnUserId = (channel: Channel, chatClient: StreamChat) =>
  (channel.pendingDisposal ? chatClient : channel.getClient()).user?.id;
