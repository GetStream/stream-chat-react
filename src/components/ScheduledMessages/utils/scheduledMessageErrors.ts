import { getScheduledMessageErrorReason, ScheduledMessageErrorReason } from 'stream-chat';
import type { ScheduledMessagePaginator } from 'stream-chat';

export const isScheduledMessageError = (
  error: unknown,
  reason: ScheduledMessageErrorReason,
) => error instanceof Error && getScheduledMessageErrorReason(error) === reason;

export const reloadOnScheduledMessageConflict = (
  paginator: ScheduledMessagePaginator,
  error: unknown,
) => {
  if (!isScheduledMessageError(error, ScheduledMessageErrorReason.Conflict)) return;

  paginator.reload().catch(() => undefined);
};
