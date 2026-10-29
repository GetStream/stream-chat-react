import { getScheduledMessageErrorReason } from 'stream-chat';
import type { ScheduledMessageErrorReason } from 'stream-chat';

export const isScheduledMessageError = (
  error: unknown,
  reason: ScheduledMessageErrorReason,
) => error instanceof Error && getScheduledMessageErrorReason(error) === reason;
