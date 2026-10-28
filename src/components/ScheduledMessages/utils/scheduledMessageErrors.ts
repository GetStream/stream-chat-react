import { getScheduledMessageErrorReason } from 'stream-chat';
import type { ScheduledMessageErrorReason } from 'stream-chat';

/**
 * Returns `true` when `error` is a scheduled message API error with the given reason.
 *
 * Errors that did not come from the API, such as network failures, never match.
 *
 * @example
 * isScheduledMessageError(error, ScheduledMessageErrorReason.IdTaken);
 */
export const isScheduledMessageError = (
  error: unknown,
  reason: ScheduledMessageErrorReason,
) => error instanceof Error && getScheduledMessageErrorReason(error) === reason;
