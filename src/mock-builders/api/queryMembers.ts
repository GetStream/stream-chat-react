import type { ChannelMemberResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/**
 * Returns the api response for queryMembers api
 *
 * api - /query_members
 */
export const queryMembersApi = (members: ChannelMemberResponse[] = []) => {
  const result = {
    members,
  };

  return mockedApiResponse(result, 'get');
};
