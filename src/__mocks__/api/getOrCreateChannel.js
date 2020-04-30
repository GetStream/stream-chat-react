import { mockedApiResponse } from './utils.js';

export const getOrCreateChannelApi = (
  channel = {
    channel: {},
    messages: [],
    members: [],
  },
) => {
  const result = {
    channel: channel.channel,
    messages: channel.messages,
    members: channel.members,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
