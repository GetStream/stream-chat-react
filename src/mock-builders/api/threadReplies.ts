import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/** Returns the mocked API response for the `/messages/{parent_id}/replies` endpoint. */
export const threadRepliesApi = (replies: (MessageResponse | LocalMessage)[] = []) => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
