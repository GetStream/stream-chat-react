export const SCHEDULE_MESSAGE_CAPABILITY = 'schedule-message';

export const SCHEDULE_MESSAGE_MENU_ID = 'schedule-message-menu';

export const SCHEDULED_MESSAGE_ACTIONS_MENU_ID = 'scheduled-message-actions-menu';

export const SCHEDULED_MESSAGE_ACTIONS_EMITTER = 'ScheduledMessageActions';

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
  Blocked: 'validation:scheduled-message:blocked',
  CreateFailed: 'api:scheduled-message:create:failed',
  CreateSucceeded: 'api:scheduled-message:create:success',
  DeleteFailed: 'api:scheduled-message:delete:failed',
  RescheduleFailed: 'api:scheduled-message:reschedule:failed',
  SendNowFailed: 'api:scheduled-message:send-now:failed',
  SendNowSucceeded: 'api:scheduled-message:send-now:success',
  UpdateFailed: 'api:scheduled-message:update:failed',
} as const;

export type ScheduledMessageNotificationType =
  (typeof ScheduledMessageNotificationType)[keyof typeof ScheduledMessageNotificationType];

export const ScheduledMessageGroupType = {
  Day: 'day',
  Failed: 'failed',
} as const;

export type ScheduledMessageGroupType =
  (typeof ScheduledMessageGroupType)[keyof typeof ScheduledMessageGroupType];

export const FAILED_SCHEDULED_MESSAGE_GROUP_ID = 'failed';

export const SCHEDULED_MESSAGE_LIST_LOADING_ROW_COUNT = 6;

export const ScheduledMessageAction = {
  Copy: 'copy',
  Delete: 'delete',
  Edit: 'edit',
  Reschedule: 'reschedule',
  SendNow: 'send_now',
} as const;

export type ScheduledMessageAction =
  (typeof ScheduledMessageAction)[keyof typeof ScheduledMessageAction];
