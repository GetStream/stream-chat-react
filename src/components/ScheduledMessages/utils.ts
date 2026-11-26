import {
  dateToNs,
  getScheduledMessageLimits,
  SCHEDULED_MESSAGE_STATUS,
  ScheduledMessageErrorReason,
  toScheduledMessagePreview,
} from 'stream-chat';
import type {
  Channel,
  MessageComposer,
  MessageRequest,
  ScheduledMessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { RESCHEDULED_MESSAGE_FIELDS } from './constants';

const pickFields = <T extends object, K extends keyof T>(
  source: T,
  fields: readonly K[],
) => {
  const picked = Object.fromEntries(
    fields.filter((field) => field in source).map((field) => [field, source[field]]),
  ) as Pick<T, K>;
  return picked;
};

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

const atLocalHour = (date: Date, dayOffset: number, hour: number) => {
  const localDate = new Date(date);
  localDate.setDate(date.getDate() + dayOffset);
  localDate.setHours(hour, 0, 0, 0);
  return localDate;
};

export const getChannelByCid = (client: StreamChat, cid: string) => {
  const [type, id] = cid.split(':');
  const channel = client.channel(type, id);
  return channel;
};

export const getScheduleDialogId = ({
  channel,
  threadId,
}: Pick<MessageComposer, 'channel' | 'threadId'>) =>
  ['schedule-message-dialog', channel.cid, threadId].filter(Boolean).join('-');

export const toCompositionPreview = ({
  attachmentManager,
  channel,
  client,
  id,
  textComposer,
}: MessageComposer) => {
  const now = dateToNs(new Date());
  const user = (client.user ?? { id: client.userID ?? '' }) as UserResponse;

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
    status: SCHEDULED_MESSAGE_STATUS.Scheduled,
    updated_at: now,
    user,
  });
  return preview;
};

export const toRescheduledMessageRequest = ({
  message,
}: ScheduledMessageResponse): MessageRequest =>
  pickFields(message, RESCHEDULED_MESSAGE_FIELDS);

export const isFailedScheduledMessage = ({ status }: ScheduledMessageResponse) =>
  status === SCHEDULED_MESSAGE_STATUS.Failed;

export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

export const toTimeInputValue = (date: Date) =>
  `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;

export const fromInputValues = (dateValue: string, timeValue = '00:00') => {
  if (!dateValue || !timeValue) return undefined;
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const getScheduleTimeBounds = (channel: Channel, now = new Date()) => {
  const limits = getScheduledMessageLimits(channel);
  const nowMs = now.getTime();
  const clockSkewBufferMs = 60 * 1000;

  const bounds: { earliest: Date; latest?: Date } = {
    earliest: new Date(
      nowMs + (limits?.minLeadTimeSeconds ?? 0) * 1000 + clockSkewBufferMs,
    ),
    latest: limits && new Date(nowMs + limits.maxLeadTimeSeconds * 1000),
  };
  return bounds;
};

export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: ReturnType<typeof getScheduleTimeBounds>,
) => {
  if (scheduledAt < earliest) return ScheduledMessageErrorReason.TooSoon;
  if (latest && scheduledAt > latest) return ScheduledMessageErrorReason.TooFar;
  return undefined;
};

export const getDefaultScheduledAt = ({
  earliest,
  latest,
}: ReturnType<typeof getScheduleTimeBounds>) => {
  const nextFullHour = new Date(earliest);
  nextFullHour.setHours(nextFullHour.getHours() + 1, 0, 0, 0);
  if (!latest || nextFullHour <= latest) return nextFullHour;

  const firstWholeMinute = new Date(earliest);
  if (firstWholeMinute.getSeconds() || firstWholeMinute.getMilliseconds()) {
    firstWholeMinute.setMinutes(firstWholeMinute.getMinutes() + 1, 0, 0);
  }
  return firstWholeMinute;
};

export const getSchedulePresets = (
  now: Date,
  bounds: ReturnType<typeof getScheduleTimeBounds>,
) => {
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const presets = [
    atLocalHour(now, 1, 9),
    atLocalHour(now, 1, 13),
    ...(daysUntilMonday === 1 ? [] : [atLocalHour(now, daysUntilMonday, 9)]),
  ];
  return presets.filter((preset) => !getScheduleTimeError(preset, bounds));
};

export const formatTimeZoneOffset = (date: Date) => {
  const timeZoneName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find(({ type }) => type === 'timeZoneName')?.value;
  return timeZoneName ?? 'GMT';
};
