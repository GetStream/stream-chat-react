import {
  dateToNs,
  getScheduledMessageErrorReason,
  getScheduledMessageLimits,
  isScheduledMessageNotFoundError,
  SCHEDULED_MESSAGE_FAILURE_REASON,
  SCHEDULED_MESSAGE_STATUS,
  ScheduledMessageErrorReason,
  StreamAPIError,
  toScheduledMessagePreview,
} from 'stream-chat';
import type {
  Channel,
  LocalMessage,
  MessageComposer,
  MessageComposerState,
  MessageRequest,
  ScheduledMessageFailureReason,
  ScheduledMessageResponse,
  UserResponse,
} from 'stream-chat';

import type { StreamTFunction } from '../../i18n/types';
import { RESCHEDULED_MESSAGE_FIELDS } from './constants';

const MS_IN_SECOND = 1000;
const CLOCK_SKEW_BUFFER_MS = 60 * MS_IN_SECOND;
const MORNING_HOUR = 9;
const AFTERNOON_HOUR = 13;
const SCHEDULE_TIME_DIALOG_ID_PREFIX = 'schedule-message-dialog';
const TIME_ZONE_LOCALE = 'en-US';
const FORBIDDEN_STATUS = 403;

const pickFields = <T extends object, K extends keyof T>(
  source: T,
  fields: readonly K[],
) => {
  const picked = Object.fromEntries(
    fields.filter((field) => field in source).map((field) => [field, source[field]]),
  ) as Pick<T, K>;
  return picked;
};

export const splitCid = (cid: string) => {
  const [type, id] = cid.split(':');
  return [type, id] as const;
};

export const getScheduleAgainDialogId = (
  messageComposer: Pick<MessageComposer, 'channel' | 'threadId'>,
) => `${getScheduleTimeDialogId(messageComposer)}-again`;

export const toCompositionPreview = (
  { attachmentManager, channel, id, textComposer }: MessageComposer,
  user: UserResponse,
): LocalMessage => {
  const now = dateToNs(new Date());
  const preview = toScheduledMessagePreview({
    cid: channel.cid,
    created_at: now,
    id,
    message: {
      attachments: attachmentManager.attachments,
      custom: {},
      text: textComposer.text,
    },
    scheduled_at: now,
    status: 'scheduled',
    updated_at: now,
    user,
  });
  return preview;
};

export const toRescheduledMessageRequest = ({
  message,
}: ScheduledMessageResponse): MessageRequest =>
  pickFields(message, RESCHEDULED_MESSAGE_FIELDS);

export const getScheduleTimeDialogId = ({
  channel,
  threadId,
}: Pick<MessageComposer, 'channel' | 'threadId'>) =>
  [SCHEDULE_TIME_DIALOG_ID_PREFIX, channel.cid, threadId].filter(Boolean).join('-');

export const isFailedScheduledMessage = ({ status }: ScheduledMessageResponse) =>
  status === SCHEDULED_MESSAGE_STATUS.Failed;

export const countPendingScheduledMessages = (
  scheduledMessages: ScheduledMessageResponse[] = [],
) => {
  const pendingCount = scheduledMessages.filter(
    ({ status }) =>
      status === SCHEDULED_MESSAGE_STATUS.Scheduled ||
      status === SCHEDULED_MESSAGE_STATUS.Sending,
  ).length;
  return pendingCount;
};

export const toDateInputValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

export const toTimeInputValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export const fromInputValues = (dateValue: string, timeValue = '00:00') => {
  if (!dateValue || !timeValue) return undefined;
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const getScheduleTimeBounds = (channel: Channel, now = new Date()) => {
  const limits = getScheduledMessageLimits(channel);
  const nowMs = now.getTime();
  const bounds: { earliest: Date; latest?: Date } = {
    earliest: new Date(
      nowMs + (limits?.minLeadTimeSeconds ?? 0) * MS_IN_SECOND + CLOCK_SKEW_BUFFER_MS,
    ),
    latest: limits && new Date(nowMs + limits.maxLeadTimeSeconds * MS_IN_SECOND),
  };
  return bounds;
};

export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: { earliest: Date; latest?: Date },
) => {
  if (scheduledAt < earliest) return 'tooSoon' as const;
  if (latest && scheduledAt > latest) return 'tooFar' as const;
  return undefined;
};

export const getDefaultScheduledAt = ({
  earliest,
  latest,
}: {
  earliest: Date;
  latest?: Date;
}) => {
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

export const getSchedulePresets = (
  now: Date,
  bounds: { earliest: Date; latest?: Date },
) => {
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const presets = [
    atLocalHour(now, 1, MORNING_HOUR),
    atLocalHour(now, 1, AFTERNOON_HOUR),
    ...(daysUntilMonday === 1 ? [] : [atLocalHour(now, daysUntilMonday, MORNING_HOUR)]),
  ];
  return presets.filter((preset) => !getScheduleTimeError(preset, bounds));
};

export const formatTimeZoneOffset = (date: Date) => {
  const timeZoneName = new Intl.DateTimeFormat(TIME_ZONE_LOCALE, {
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find(({ type }) => type === 'timeZoneName')?.value;
  return timeZoneName ?? 'GMT';
};

export const isComposerEditing = ({
  editedMessage,
  editedScheduledMessage,
}: Pick<MessageComposerState, 'editedMessage' | 'editedScheduledMessage'>) =>
  !!editedMessage ||
  (!!editedScheduledMessage && !isFailedScheduledMessage(editedScheduledMessage));

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
