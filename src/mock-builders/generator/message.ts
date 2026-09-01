import { nanoid } from 'nanoid';
import type { LocalMessage, MessageResponse } from 'stream-chat';
import type { DeepPartial } from '../../types/types';
import { convertDateToTimestamp } from './time';

type GenerateMessageOptions = Omit<
  DeepPartial<MessageResponse>,
  'created_at' | 'updated_at'
> & {
  created_at?: Date | number | string;
  updated_at?: Date | number | string;
};

/** The message fields the API sends as unix-nanosecond numbers. */
const TIMESTAMP_FIELDS = [
  'created_at',
  'updated_at',
  'deleted_at',
  'pinned_at',
  'pin_expires',
  'message_text_updated_at',
] as const;

export const generateMessage = (options?: GenerateMessageOptions): LocalMessage => {
  const data = {
    __html: '<p>regular</p>',
    attachments: [],
    created_at: convertDateToTimestamp(),
    html: '<p>regular</p>',
    id: nanoid(),
    mentioned_users: [],
    pinned_at: null,
    status: 'received',
    text: nanoid(),
    type: 'regular',
    updated_at: convertDateToTimestamp(),
    user: null,
    ...options,
  } as unknown as LocalMessage;
  // Tests read better overriding a timestamp with a date literal, but the wire carries numbers —
  // and a fixture handing the SDK a `Date` cannot catch the bugs that unit exists to prevent.
  // Normalize every timestamp override here so no individual test has to.
  for (const field of TIMESTAMP_FIELDS) {
    const value = (data as unknown as Record<string, unknown>)[field];
    if (value != null && typeof value !== 'number') {
      (data as unknown as Record<string, unknown>)[field] = convertDateToTimestamp(
        value as Date | number | string,
      );
    }
  }
  if (data['reminder']) {
    (data['reminder'] as any).message_id = data.id;
  }
  return data;
};
