import type { ChannelAPIResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
 */
export const getOrCreateChannelApi = (
  channel: ChannelAPIResponse = {
    channel: {},
    members: [],
    messages: [],
    pinned_messages: [],
  } as ChannelAPIResponse,
) => {
  const result: Partial<ChannelAPIResponse> & { duration: number } = {
    channel: channel.channel,
    duration: 0.01,
    members: channel.members,
    messages: channel.messages,
    pinned_messages: channel.pinned_messages,
    read: channel.read,
  };
  if (channel.draft) {
    result.draft = channel.draft;
  }

  return mockedApiResponse(result, 'post');
};
