import { fromPartial } from '@total-typescript/shoehorn';
import type { MessageResponse, ReminderResponseData, UserResponse } from 'stream-chat';
import { generateChannel } from './channel';

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
  const created_at = new Date();
  const basePayload: ReminderResponseData = {
    ...baseData,
    channel: generateChannel({ channel: { cid: baseData.channel_cid } }).channel,
    created_at,
    message: fromPartial<MessageResponse>({ id: baseData.message_id, type: 'regular' }),
    updated_at: created_at,
    user: fromPartial<UserResponse>({ id: baseData.user_id }),
  };
  if (typeof scheduleOffsetMs === 'number') {
    basePayload.remind_at = new Date(created_at.getTime() + scheduleOffsetMs);
  }
  return {
    ...basePayload,
    ...data,
  };
};
