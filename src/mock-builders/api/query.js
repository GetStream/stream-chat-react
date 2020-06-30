import { mockedApiResponse } from './utils.js';

/**
 * Returns the api response for query api
 *
 * api - /query
 *
 * @param {*} messages Array of message objects.
 */
export const queryApi = (channel, messages = []) => {
  const result = {
    channel: {
      type: channel.type,
      config: channel.getConfig(),
    },
    messages,
  };

  return mockedApiResponse(result, 'post');
};
