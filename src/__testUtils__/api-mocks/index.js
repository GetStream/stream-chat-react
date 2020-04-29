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

export { queryChannelsApi, getOrCreateChannelApi } from './channel';
export { sendMessageApi } from './message';
