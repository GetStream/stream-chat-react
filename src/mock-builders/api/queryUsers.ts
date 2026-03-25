import type { UserResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/**
 * Returns the api response for queryUsers api
 *
 * api - /users
 */
export const queryUsersApi = (users: UserResponse[] = []) => {
  const result = {
    users,
  };

  return mockedApiResponse(result, 'get');
};
