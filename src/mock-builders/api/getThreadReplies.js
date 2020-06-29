import { mockedApiResponse } from './utils.js';

/**
 * Returns the api response for thread replies api
 *
 * api - /messages/${parent_id}/replies
 *
 * @param {*} replies Array of channel objects.
 */
export const getThreadReplies = (replies = []) => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
