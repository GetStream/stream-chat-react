/**
 * Hook to mock the calls made through axios module.
 * You should provide the responses of Apis in order that they will be called.
 * You should use api functions from current directory to build these responses.
 * e.g., queryChannelsApi, sendMessageApi
 *
 * @param {*} axios
 * @param {*} apiResponses
 */
export const useMockedApis = (axios, apiResponses) => {
  let getMock = axios.get;
  let deleteMock = axios.delete;
  let putMock = axios.put;
  let postMock = axios.post;

  apiResponses.forEach((ar) => {
    if (ar.type === 'get') {
      getMock = getMock.mockResolvedValue(ar.response);
    }
    if (ar.type === 'delete') {
      deleteMock = deleteMock.mockResolvedValue(ar.response);
    }
    if (ar.type === 'post') {
      postMock = postMock.mockResolvedValue(ar.response);
    }
    if (ar.type === 'put') {
      putMock = putMock.mockResolvedValue(ar.response);
    }
  });
};

export * from './queryChannels';
export * from './queryMembers';
export * from './getOrCreateChannel';
export * from './threadReplies';
export * from './sendMessage';
export * from './error';
