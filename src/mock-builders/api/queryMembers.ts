import type { ChannelMemberResponse } from 'stream-chat';

import { mockedApiResponse } from './utils';

/** Returns the mocked API response for the `/query_members` endpoint. */
export const queryMembersApi = (members: ChannelMemberResponse[] = []) => {
  const result = {
    members,
  };

  return mockedApiResponse(result, 'get');
};
