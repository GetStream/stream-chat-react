import { v4 as uuidv4 } from 'uuid';

export const generateMessage = (options) => {
  return {
    __html: '<p>regular</p>',
    id: uuidv4(),
    text: uuidv4(),
    type: 'regular',
    html: '<p>regular</p>',
    attachments: [],
    created_at: new Date(),
    pinned_at: null,
    updated_at: new Date(),
    user: null,
    status: 'received',
    ...options,
  };
};
