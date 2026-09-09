import { nowNs } from 'stream-chat';
import { nanoid } from 'nanoid';
import type { LocalMessage, MessageResponse } from 'stream-chat';
import type { DeepPartial } from '../../types/types';

type GenerateMessageOptions = Omit<
  DeepPartial<MessageResponse>,
  'created_at' | 'updated_at'
> & {
  /** Wire timestamps (unix nanoseconds), as the API sends them. Build one with `ts()`. */
  created_at?: number;
  updated_at?: number;
};

export const generateMessage = (options?: GenerateMessageOptions): LocalMessage => {
  const data = {
    __html: '<p>regular</p>',
    attachments: [],
    created_at: nowNs(),
    html: '<p>regular</p>',
    id: nanoid(),
    mentioned_users: [],
    pinned_at: null,
    status: 'received',
    text: nanoid(),
    type: 'regular',
    updated_at: nowNs(),
    user: null,
    ...options,
  } as unknown as LocalMessage;
  if (data['reminder']) {
    (data['reminder'] as any).message_id = data.id;
  }
  return data;
};
