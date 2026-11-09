import { nanoid } from 'nanoid';
import type { LocalMessage } from 'stream-chat';
import type { DeepPartial } from '../../types/types';
import { convertDateToTimestamp } from './time';

/**
 * Timestamp overrides are unix-nanosecond numbers, as on the wire; convert a date literal at the
 * call site with `convertDateToTimestamp`. `timestamp` seeds both `created_at` and `updated_at`
 * from one wall-clock value. It is not named `date` because `DateSeparatorMessage.date` is a real
 * field of the rendered view-model that such a param would swallow.
 */
type GenerateMessageOptions = DeepPartial<LocalMessage> & {
  timestamp?: Date | number | string;
};

export const generateMessage = (options?: GenerateMessageOptions): LocalMessage => {
  const { timestamp: seed, ...overrides } = options ?? {};
  const timestamp = convertDateToTimestamp(seed);
  const data = {
    __html: '<p>regular</p>',
    attachments: [],
    created_at: timestamp,
    html: '<p>regular</p>',
    id: nanoid(),
    mentioned_users: [],
    pinned_at: null,
    status: 'received',
    text: nanoid(),
    type: 'regular',
    updated_at: timestamp,
    user: null,
    ...overrides,
  } as unknown as LocalMessage;
  if (data['reminder']) {
    (data['reminder'] as any).message_id = data.id;
  }
  return data;
};
