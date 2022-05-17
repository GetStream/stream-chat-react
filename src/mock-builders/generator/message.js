import { nanoid } from 'nanoid';

export const generateMessage = (options) => ({
  __html: '<p>regular</p>',
  attachments: [],
  created_at: new Date(),
  html: '<p>regular</p>',
  id: nanoid(),
  pinned_at: null,
  status: 'received',
  text: nanoid(),
  type: 'regular',
  updated_at: new Date(),
  user: null,
  ...options,
});
