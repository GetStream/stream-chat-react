import { v4 as uuidv4 } from 'uuid';

export const generateMessage = (options) => ({
  __html: '<p>regular</p>',
  attachments: [],
  created_at: new Date(),
  id: uuidv4(),
  html: '<p>regular</p>',
  pinned_at: null,
  status: 'received',
  text: uuidv4(),
  type: 'regular',
  updated_at: new Date(),
  user: null,
  ...options,
});
