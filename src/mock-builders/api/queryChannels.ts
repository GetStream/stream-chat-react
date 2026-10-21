import type { ChannelAPIResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/** Returns the mocked API response for the `/channels` endpoint. */
export const queryChannelsApi = (channels: ChannelAPIResponse[] = []) => {
  const result = {
    channels,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
