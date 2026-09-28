import { nanoid } from 'nanoid';
import type { LocalMessage } from 'stream-chat';
import type { DeepPartial } from '../../types/types';
import { convertDateToTimestamp } from './time';

/**
 * Timestamp overrides are the unix-nanosecond numbers the API puts on the wire — a fixture holding
 * a `Date` or an ISO string cannot catch the bugs that unit exists to prevent, and the compiler
 * now says so. Where a test reads better against a date literal, convert at the call site with
 * `convertDateToTimestamp`. `timestamp` is the shorthand for the common case of seeding
 * both `created_at` and `updated_at` from one wall-clock value. It is deliberately not called
 * `date`: `DateSeparatorMessage.date` is a real field on the rendered view-model, and a generator
 * param of that name would swallow it.
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
