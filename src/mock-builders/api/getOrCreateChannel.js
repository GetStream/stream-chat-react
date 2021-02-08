import { mockedApiResponse } from './utils.js';

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
 *
 * @param {*} channel
 */
export const getOrCreateChannelApi = (
  channel = {
    channel: {},
    members: [],
    messages: [],
    pinnedMessages: [],
  },
) => {
  const result = {
    channel: channel.channel,
    duration: 0.01,
    members: channel.members,
    messages: channel.messages,
    pinnedMessages: channel.pinnedMessages,
  };

  return mockedApiResponse(result, 'post');
};
