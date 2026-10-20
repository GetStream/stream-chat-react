import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/** Returns the mocked API response for the `/channels/{type}/{id}/message` endpoint. */
export const sendMessageApi = (
  message: MessageResponse | LocalMessage = {} as MessageResponse,
) => {
  const result = {
    message,
  };

  return mockedApiResponse(result, 'post');
};
