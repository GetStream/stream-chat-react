import { nanoid } from 'nanoid';

export const generateMessage = (options) => {
  const data = {
    __html: '<p>regular</p>',
    attachments: [],
    created_at: new Date(),
    html: '<p>regular</p>',
    id: nanoid(),
    mentioned_users: [],
    pinned_at: null,
    status: 'received',
    text: nanoid(),
    type: 'regular',
    updated_at: new Date(),
    user: null,
    ...options,
  };
  if (data.reminder) {
    data.reminder.message_id = data.id;
  }
  return data;
};
