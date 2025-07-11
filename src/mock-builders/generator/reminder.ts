import type { ReminderResponse } from 'stream-chat';
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
  data?: Partial<ReminderResponse>;
  scheduleOffsetMs?: number;
} = {}): ReminderResponse => {
  const created_at = new Date().toISOString();
  const basePayload: ReminderResponse = {
    ...baseData,
    channel: generateChannel({ channel: { cid: baseData.channel_cid } }).channel,
    created_at,
    message: { id: baseData.message_id, type: 'regular' },
    updated_at: created_at,
    user: { id: baseData.user_id },
  };
  if (typeof scheduleOffsetMs === 'number') {
    basePayload.remind_at = new Date(
      new Date(created_at).getTime() + scheduleOffsetMs,
    ).toISOString();
  }
  return {
    ...basePayload,
    ...data,
  };
};
