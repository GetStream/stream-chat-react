import { mockedApiResponse } from './utils.js';
import user2 from '../mocked-data/users/u2.json';

export const sendMessageApi = () => {
  const result = {
    message: {
      text: 'hey this is new message',
      type: 'regular',
      user: user2,
    },
  };

  return mockedApiResponse(result, 'post');
};
