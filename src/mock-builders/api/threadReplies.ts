import type { MessageResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/**
 * Returns the api response for thread replies api
 *
 * api - /messages/${parent_id}/replies
 */
export const threadRepliesApi = (replies: MessageResponse[] = []) => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
