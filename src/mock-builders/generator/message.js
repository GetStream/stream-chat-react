import { v4 as uuidv4 } from 'uuid';

export const generateMessage = (options) => {
  return {
    id: uuidv4(),
    text: uuidv4(),
    type: 'regular',
    attachments: [],
    created_at: new Date(),
    updated_at: new Date(),
    user: null,
    ...options,
  };
};
