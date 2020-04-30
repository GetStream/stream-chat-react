import { mockedApiResponse } from './utils.js';

export const sendMessageApi = (message = {}) => {
  const result = {
    message,
  };

  return mockedApiResponse(result, 'post');
};
