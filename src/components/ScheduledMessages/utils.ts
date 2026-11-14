import {
  getScheduledMessageErrorReason,
  getScheduledMessageLimits,
  isScheduledMessageNotFoundError,
  SCHEDULED_MESSAGE_FAILURE_REASON,
  SCHEDULED_MESSAGE_STATUS,
  ScheduledMessageErrorReason,
  StreamAPIError,
} from 'stream-chat';
import type {
  Channel,
  MessageComposerState,
  ScheduledMessageFailureReason,
  ScheduledMessageResponse,
} from 'stream-chat';

import type { StreamTFunction } from '../../i18n/types';

const MS_IN_SECOND = 1000;
/** Keeps the earliest offered time ahead of the server's minimum despite clock skew. */
const CLOCK_SKEW_BUFFER_MS = 60 * MS_IN_SECOND;
const MORNING_HOUR = 9;
const AFTERNOON_HOUR = 13;

/** Notifications the UI emits; the composer's own come from `CORE_NOTIFICATION_TYPE`. */
export const SCHEDULED_MESSAGE_NOTIFICATION_TYPE = {
  copyFailed: 'browser:scheduled-message:copy:failed',
  deleteFailed: 'api:scheduled-message:delete:failed',
  sendNowFailed: 'api:scheduled-message:send-now:failed',
  sendNowSucceeded: 'api:scheduled-message:send-now:success',
} as const;

export const SCHEDULED_MESSAGES_EMITTER = 'ScheduledMessages';

export type ScheduleTimeBounds = { earliest: Date; latest?: Date };

/** A channel's type and ID, for `client.channel(...splitCid(cid))`. Channel IDs contain no `:`. */
export const splitCid = (cid: string) => {
  const [type, id] = cid.split(':');
  return [type, id] as const;
};

export const isFailedScheduledMessage = ({ status }: ScheduledMessageResponse) =>
  status === SCHEDULED_MESSAGE_STATUS.Failed;

/** A channel's list holds its replies too: a thread keeps its own, a channel its top-level ones. */
/** The default search: the text contains the query, ignoring case; a blank query matches all. */
export const matchesScheduledMessageText = (
  { message }: ScheduledMessageResponse,
  searchQuery: string,
) => {
  const query = searchQuery.trim().toLocaleLowerCase();
  return !query || !!message.text?.toLocaleLowerCase().includes(query);
};

export const toDateInputValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

export const toTimeInputValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** The local date of `<input type="date">` and time of `<input type="time">`, if both are valid. */
export const fromInputValues = (dateValue: string, timeValue = '00:00') => {
  if (!dateValue || !timeValue) return undefined;
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** The times the channel accepts; no `latest` when it reports no limits. */
export const getScheduleTimeBounds = (channel: Channel, now = new Date()) => {
  const limits = getScheduledMessageLimits(channel);
  const nowMs = now.getTime();
  const bounds: ScheduleTimeBounds = {
    earliest: new Date(
      nowMs + (limits?.minLeadTimeSeconds ?? 0) * MS_IN_SECOND + CLOCK_SKEW_BUFFER_MS,
    ),
    latest: limits && new Date(nowMs + limits.maxLeadTimeSeconds * MS_IN_SECOND),
  };
  return bounds;
};

export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: ScheduleTimeBounds,
) => {
  if (scheduledAt < earliest) return 'tooSoon' as const;
  if (latest && scheduledAt > latest) return 'tooFar' as const;
  return undefined;
};

/**
 * The next full hour after the earliest allowed time, or, when that is past the latest one, the
 * first whole minute allowed (the fields pick minutes).
 */
export const getDefaultScheduledAt = ({ earliest, latest }: ScheduleTimeBounds) => {
  const nextFullHour = new Date(earliest);
  nextFullHour.setHours(nextFullHour.getHours() + 1, 0, 0, 0);
  if (!latest || nextFullHour <= latest) return nextFullHour;
  const firstWholeMinute = new Date(earliest);
  if (firstWholeMinute.getSeconds() || firstWholeMinute.getMilliseconds()) {
    firstWholeMinute.setMinutes(firstWholeMinute.getMinutes() + 1, 0, 0);
  }
  return firstWholeMinute;
};

const atLocalHour = (date: Date, dayOffset: number, hour: number) => {
  const localDate = new Date(date);
  localDate.setDate(date.getDate() + dayOffset);
  localDate.setHours(hour, 0, 0, 0);
  return localDate;
};

/** Tomorrow morning and afternoon and next Monday morning, within `bounds`. */
export const getSchedulePresets = (now: Date, bounds: ScheduleTimeBounds) => {
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const presets = [
    atLocalHour(now, 1, MORNING_HOUR),
    atLocalHour(now, 1, AFTERNOON_HOUR),
    ...(daysUntilMonday === 1 ? [] : [atLocalHour(now, daysUntilMonday, MORNING_HOUR)]),
  ];
  return presets.filter((preset) => !getScheduleTimeError(preset, bounds));
};

export const formatTimeZoneOffset = (date: Date) => {
  const offsetMinutes = -date.getTimezoneOffset();
  if (!offsetMinutes) return 'GMT';
  const sign = offsetMinutes < 0 ? '-' : '+';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`;
};

/**
 * Whether the composer edits a message: a message, or a pending scheduled one. A failed scheduled
 * message open in it is not edited but sent or scheduled again, so the composer works as usual.
 */
export const isComposerEditing = ({
  editedMessage,
  editedScheduledMessage,
}: Pick<MessageComposerState, 'editedMessage' | 'editedScheduledMessage'>) =>
  !!editedMessage ||
  (!!editedScheduledMessage && !isFailedScheduledMessage(editedScheduledMessage));

/** Why a scheduled message failed; `undefined` when the reason needs no explanation. */
export const translateScheduledMessageFailureReason = (
  t: StreamTFunction,
  reason?: ScheduledMessageFailureReason,
) => {
  switch (reason) {
    case SCHEDULED_MESSAGE_FAILURE_REASON.Banned:
      return t(
        'scheduledMessages.youCantSendMessagesInThisChannel',
        "You can't send messages in this channel",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.NoPermission:
      return t(
        'scheduledMessages.youreNoLongerAllowedToPostHere',
        "You're no longer allowed to post here",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen:
      return t('scheduledMessages.thisChannelIsFrozen', 'This channel is frozen');
    case SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted:
      return t('scheduledMessages.thisChannelWasDeleted', 'This channel was deleted');
    case SCHEDULED_MESSAGE_FAILURE_REASON.UserDeleted:
      return undefined;
    case SCHEDULED_MESSAGE_FAILURE_REASON.ModerationBlocked:
      return t('scheduledMessages.blockedByModeration', 'Blocked by moderation');
    case SCHEDULED_MESSAGE_FAILURE_REASON.HookRejected:
      return t('scheduledMessages.rejectedByTheApp', 'Rejected by the app');
    case SCHEDULED_MESSAGE_FAILURE_REASON.Expired:
      return t(
        'scheduledMessages.notSentTheServiceWasDelayed',
        'Not sent: the service was delayed',
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.InvalidMessage:
      return t(
        'scheduledMessages.theMessageNoLongerMeetsTheAppsLimits',
        "The message no longer meets the app's limits. Edit it",
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.PendingNotSupported:
      return t(
        'scheduledMessages.thisChannelNowNeedsApprovalScheduleItAgain',
        'This channel now needs approval. Schedule it again',
      );
    case SCHEDULED_MESSAGE_FAILURE_REASON.InternalError:
      return t(
        'scheduledMessages.somethingWentWrongTryAgain',
        'Something went wrong. Try again',
      );
    default:
      return t('scheduledMessages.couldntSendTryAgain', "Couldn't send. Try again");
  }
};

const FORBIDDEN_STATUS = 403;

/** What a failed scheduled-message request tells the user, when its error says something specific. */
export const translateScheduledMessageError = (t: StreamTFunction, error: unknown) => {
  switch (getScheduledMessageErrorReason(error)) {
    case ScheduledMessageErrorReason.Disabled:
      return t(
        'scheduledMessages.notification.disabled',
        'Scheduled messages are turned off',
      );
    case ScheduledMessageErrorReason.TooSoon:
      return t('scheduledMessages.chooseALaterTime', 'Choose a later time');
    case ScheduledMessageErrorReason.TooFar:
      return t('scheduledMessages.chooseAnEarlierTime', 'Choose an earlier time');
    case ScheduledMessageErrorReason.ChannelLimit:
      return t(
        'scheduledMessages.notification.channelLimit',
        "You've reached the limit of scheduled messages in this channel",
      );
    case ScheduledMessageErrorReason.UserLimit:
      return t(
        'scheduledMessages.notification.userLimit',
        "You've reached the limit of scheduled messages",
      );
    case ScheduledMessageErrorReason.Sending:
      return t('scheduledMessages.notification.sending', 'This message is being sent');
    case ScheduledMessageErrorReason.Conflict:
      return t('scheduledMessages.notification.conflict', 'Updated elsewhere. Try again');
    case ScheduledMessageErrorReason.NotEditable:
      return t(
        'scheduledMessages.notification.notEditable',
        "Failed messages can't be edited",
      );
    default:
      break;
  }
  if (isScheduledMessageNotFoundError(error)) {
    return t('scheduledMessages.notification.alreadySent', 'Already sent');
  }
  if (error instanceof StreamAPIError && error.status === FORBIDDEN_STATUS) {
    return t(
      'scheduledMessages.notification.forbidden',
      "You can't schedule messages here",
    );
  }
  return undefined;
};
