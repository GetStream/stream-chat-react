import { v4 as uuidv4 } from 'uuid';

export const generateUser = (options = {}) => ({
  banned: false,
  created_at: '2020-04-27T13:39:49.331742Z',
  id: uuidv4(),
  image: uuidv4(),
  name: uuidv4(),
  online: false,
  role: 'user',
  updated_at: '2020-04-27T13:39:49.332087Z',
  ...options,
});
