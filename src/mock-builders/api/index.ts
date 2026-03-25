import type { StreamChat } from 'stream-chat';

import type { MockedApiResponse } from './utils';

/**
 * Hook to mock the calls made through axios module.
 * You should provide the responses of Apis in order that they will be called.
 * You should use api functions from current directory to build these responses.
 * e.g., queryChannelsApi, sendMessageApi
 */
export const useMockedApis = (client: StreamChat, apiResponses: MockedApiResponse[]) => {
  apiResponses.forEach(({ response, type }) => {
    (vi.spyOn(client.axiosInstance as any, type) as any)
      .mockImplementation()
      .mockResolvedValue(response);
  });
};

export * from './queryChannels';
export * from './queryMembers';
export * from './queryUsers';
export * from './getOrCreateChannel';
export * from './markRead';
export * from './threadReplies';
export * from './sendMessage';
export * from './error';
