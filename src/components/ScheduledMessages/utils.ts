import {
  dateToNs,
  getScheduledMessageLimits,
  SCHEDULED_MESSAGE_STATUS,
  toScheduledMessagePreview,
} from 'stream-chat';
import type {
  Channel,
  LocalMessage,
  MessageComposer,
  MessageComposerState,
  MessageRequest,
  ScheduledMessageResponse,
  UserResponse,
} from 'stream-chat';

import { RESCHEDULED_MESSAGE_FIELDS } from './constants';

const MS_IN_SECOND = 1000;
const CLOCK_SKEW_BUFFER_MS = 60 * MS_IN_SECOND;
const MORNING_HOUR = 9;
const AFTERNOON_HOUR = 13;
const SCHEDULE_TIME_DIALOG_ID_PREFIX = 'schedule-message-dialog';
const TIME_ZONE_LOCALE = 'en-US';

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

export const getScheduleCompositionDialogId = (
  messageComposer: Pick<MessageComposer, 'channel' | 'threadId'>,
) => `${getScheduleTimeDialogId(messageComposer)}-composition`;

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
