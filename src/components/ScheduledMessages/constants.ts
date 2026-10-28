export const SCHEDULE_MESSAGE_CAPABILITY = 'schedule-message';

export const SCHEDULE_MESSAGE_MENU_ID = 'schedule-message-menu';

export const SCHEDULE_MESSAGE_NOTIFICATION_EMITTER = 'ScheduleMessage';

export const CLOCK_SKEW_BUFFER_MS = 60 * 1000;

export const SchedulePresetHour = {
  Afternoon: 13,
  Morning: 9,
} as const;

export type SchedulePresetHour =
  (typeof SchedulePresetHour)[keyof typeof SchedulePresetHour];

export const ScheduleTimeError = {
  TooFar: 'too_far',
  TooSoon: 'too_soon',
} as const;

export type ScheduleTimeError =
  (typeof ScheduleTimeError)[keyof typeof ScheduleTimeError];

export const ScheduleMessageNoticeSeverity = {
  Error: 'error',
  Info: 'info',
} as const;

export type ScheduleMessageNoticeSeverity =
  (typeof ScheduleMessageNoticeSeverity)[keyof typeof ScheduleMessageNoticeSeverity];

export const ScheduledMessageNotificationType = {
  CommandRejected: 'validation:scheduled-message:command',
  CreateFailed: 'api:scheduled-message:create:failed',
  CreateSucceeded: 'api:scheduled-message:create:success',
} as const;

export type ScheduledMessageNotificationType =
  (typeof ScheduledMessageNotificationType)[keyof typeof ScheduledMessageNotificationType];
