import { v4 as uuidv4 } from 'uuid';

export const generateMessage = (options) => ({
  __html: '<p>regular</p>',
  attachments: [],
  created_at: new Date(),
  html: '<p>regular</p>',
  id: uuidv4(),
  pinned_at: null,
  status: 'received',
  text: uuidv4(),
  type: 'regular',
  updated_at: new Date(),
  user: null,
  ...options,
});
