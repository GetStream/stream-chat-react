import { mockedApiResponse } from './utils';

interface ChannelData {
  channel: Record<string, any>;
  draft?: any;
  members: any[];
  messages: any[];
  pinnedMessages: any[];
  read?: any[];
}

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
 */
export const getOrCreateChannelApi = (
  channel: ChannelData = {
    channel: {},
    members: [],
    messages: [],
    pinnedMessages: [],
    read: [],
  },
) => {
  const result: Record<string, unknown> = {
    channel: channel.channel,
    duration: 0.01,
    members: channel.members,
    messages: channel.messages,
    pinnedMessages: channel.pinnedMessages,
    read: channel.read,
  };
  if (channel.draft) {
    result.draft = channel.draft;
  }

  return mockedApiResponse(result, 'post');
};
