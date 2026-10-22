import type { UserResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/** Returns the mocked API response for the `/users` endpoint. */
export const queryUsersApi = (users: UserResponse[] = []) => {
  const result = {
    users,
  };

  return mockedApiResponse(result, 'get');
};
