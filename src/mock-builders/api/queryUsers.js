import { mockedApiResponse } from './utils.js';

/**
 * Returns the api response for queryUsers api
 *
 * api - /users
 *
 * @param {*} users Array of User objects.
 */
export const queryUsersApi = (users = []) => {
  const result = {
    users,
  };

  return mockedApiResponse(result, 'get');
};
