import { getScheduledMessageErrorReason, ScheduledMessageErrorReason } from 'stream-chat';
import type { ScheduledMessageManager } from 'stream-chat';

export const isScheduledMessageError = (
  error: unknown,
  reason: ScheduledMessageErrorReason,
) => error instanceof Error && getScheduledMessageErrorReason(error) === reason;

export const reloadOnScheduledMessageConflict = (
  manager: ScheduledMessageManager,
  error: unknown,
) => {
  if (!isScheduledMessageError(error, ScheduledMessageErrorReason.Conflict)) return;

  manager.load().catch(() => undefined);
};
