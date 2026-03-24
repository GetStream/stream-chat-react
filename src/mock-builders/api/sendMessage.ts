import type { MessageResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/**
 * Returns the api response for sendMessage api.
 *
 * api - /channels/{type}/{id}/message
 */
export const sendMessageApi = (
  message: MessageResponse | Record<string, unknown> = {},
) => {
  const result = {
    message,
  };

  return mockedApiResponse(result, 'post');
};
