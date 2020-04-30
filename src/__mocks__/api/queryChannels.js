import { mockedApiResponse } from './utils.js';

export const queryChannelsApi = (channels = []) => {
  const result = {
    channels,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'get');
};
