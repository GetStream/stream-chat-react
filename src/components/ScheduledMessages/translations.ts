import {
  getScheduledMessageErrorReason,
  SCHEDULED_MESSAGE_FAILURE_REASON,
  ScheduledMessageErrorReason,
  StreamAPIError,
} from 'stream-chat';
import type { ScheduledMessageFailureReason } from 'stream-chat';

import type { StreamTFunction } from '../../i18n/types';

const NOT_FOUND_STATUS = 404;
const FORBIDDEN_STATUS = 403;

type ScheduledMessageTranslation = (t: StreamTFunction) => string;

type ScheduledMessageErrorKey =
  | ScheduledMessageErrorReason
  | typeof NOT_FOUND_STATUS
  | typeof FORBIDDEN_STATUS;

export const SCHEDULED_MESSAGE_FAILURE_REASON_TRANSLATIONS: Record<
  ScheduledMessageFailureReason,
  ScheduledMessageTranslation | null
> = {
  [SCHEDULED_MESSAGE_FAILURE_REASON.Banned]: (t) =>
    t(
      'scheduledMessages.youCantSendMessagesInThisChannel',
      "You can't send messages in this channel",
    ),
  [SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted]: (t) =>
    t('scheduledMessages.thisChannelWasDeleted', 'This channel was deleted'),
  [SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen]: (t) =>
    t('scheduledMessages.thisChannelIsFrozen', 'This channel is frozen'),
  [SCHEDULED_MESSAGE_FAILURE_REASON.Expired]: (t) =>
    t(
      'scheduledMessages.notSentTheServiceWasDelayed',
      'Not sent: the service was delayed',
    ),
  [SCHEDULED_MESSAGE_FAILURE_REASON.HookRejected]: (t) =>
    t('scheduledMessages.rejectedByTheApp', 'Rejected by the app'),
  [SCHEDULED_MESSAGE_FAILURE_REASON.InternalError]: (t) =>
    t('scheduledMessages.somethingWentWrongTryAgain', 'Something went wrong. Try again'),
  [SCHEDULED_MESSAGE_FAILURE_REASON.InvalidMessage]: (t) =>
    t(
      'scheduledMessages.theMessageNoLongerMeetsTheAppsLimits',
      "The message no longer meets the app's limits. Edit it",
    ),
  [SCHEDULED_MESSAGE_FAILURE_REASON.ModerationBlocked]: (t) =>
    t('scheduledMessages.blockedByModeration', 'Blocked by moderation'),
  [SCHEDULED_MESSAGE_FAILURE_REASON.NoPermission]: (t) =>
    t(
      'scheduledMessages.youreNoLongerAllowedToPostHere',
      "You're no longer allowed to post here",
    ),
  [SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported]: (t) =>
    t(
      'scheduledMessages.thisChannelNowNeedsApprovalScheduleItAgain',
      'This channel now needs approval. Schedule it again',
    ),
  [SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted]: null,
};

export const SCHEDULED_MESSAGE_ERROR_TRANSLATIONS: Partial<
  Record<ScheduledMessageErrorKey, ScheduledMessageTranslation>
> = {
  [ScheduledMessageErrorReason.AlreadySent]: (t) =>
    t('scheduledMessages.notification.alreadySent', 'Already sent'),
  [ScheduledMessageErrorReason.ChannelLimit]: (t) =>
    t(
      'scheduledMessages.notification.channelLimit',
      "You've reached the limit of scheduled messages in this channel",
    ),
  [ScheduledMessageErrorReason.Conflict]: (t) =>
    t('scheduledMessages.notification.conflict', 'Updated elsewhere. Try again'),
  [ScheduledMessageErrorReason.Disabled]: (t) =>
    t('scheduledMessages.notification.disabled', 'Scheduled messages are turned off'),
  [ScheduledMessageErrorReason.NotEditable]: (t) =>
    t('scheduledMessages.notification.notEditable', "Failed messages can't be edited"),
  [ScheduledMessageErrorReason.Sending]: (t) =>
    t('scheduledMessages.notification.sending', 'This message is being sent'),
  [ScheduledMessageErrorReason.TooFar]: (t) =>
    t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time'),
  [ScheduledMessageErrorReason.TooSoon]: (t) =>
    t('scheduledMessages.chooseALaterTime', 'Choose a later time'),
  [ScheduledMessageErrorReason.UserLimit]: (t) =>
    t(
      'scheduledMessages.notification.userLimit',
      "You've reached the limit of scheduled messages",
    ),
  [FORBIDDEN_STATUS]: (t) =>
    t('scheduledMessages.notification.forbidden', "You can't schedule messages here"),
  [NOT_FOUND_STATUS]: (t) =>
    t('scheduledMessages.notification.alreadySent', 'Already sent'),
};

export const getScheduledMessageErrorKey = (
  error: unknown,
): ScheduledMessageErrorKey | undefined => {
  const reason = getScheduledMessageErrorReason(error);
  if (reason) return reason;
  if (!(error instanceof StreamAPIError)) return undefined;
  if (error.status === NOT_FOUND_STATUS || error.status === FORBIDDEN_STATUS) {
    return error.status;
  }
  return undefined;
};
