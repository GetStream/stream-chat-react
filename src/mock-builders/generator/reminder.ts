import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageResponse, ReminderResponseData, UserResponse } from 'stream-chat';
import { generateChannel } from './channel';
import { convertDateToTimestamp } from './time';
import { msToNs } from 'stream-chat';

const baseData = {
  channel_cid: 'messaging:id',
  message_id: 'message_id',
  user_id: 'user_id',
} as const;

export const generateReminderResponse = ({
  data,
  scheduleOffsetMs,
}: {
  data?: Partial<ReminderResponseData>;
  scheduleOffsetMs?: number;
} = {}): ReminderResponseData => {
  const created_at = convertDateToTimestamp();
  const basePayload: ReminderResponseData = {
    ...baseData,
    channel: generateChannel({ channel: { cid: baseData.channel_cid } }).channel,
    created_at,
    message: fromPartial<MessageResponse>({ id: baseData.message_id, type: 'regular' }),
    updated_at: created_at,
    user: fromPartial<UserResponse>({ id: baseData.user_id }),
  };
  if (typeof scheduleOffsetMs === 'number') {
    basePayload.remind_at = created_at + msToNs(scheduleOffsetMs);
  }
  return {
    ...basePayload,
    ...data,
  };
};
