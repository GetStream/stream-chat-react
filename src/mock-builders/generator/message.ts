import { nanoid } from 'nanoid';
import type { MessageResponse } from 'stream-chat';
import type { DeepPartial } from '../../types/types';

type GenerateMessageOptions = DeepPartial<MessageResponse> & {
  created_at?: Date | string;
  updated_at?: Date | string;
};

export const generateMessage = (options?: GenerateMessageOptions) => {
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
  } as MessageResponse;
  if ((data as any).reminder) {
    (data as any).reminder.message_id = data.id;
  }
  return data;
};
