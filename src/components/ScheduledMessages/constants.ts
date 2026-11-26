export const SCHEDULED_MESSAGE_NOTIFICATION_TYPE = {
  copyFailed: 'browser:scheduled-message:copy:failed',
  deleteFailed: 'api:scheduled-message:delete:failed',
  sendNowFailed: 'api:scheduled-message:send-now:failed',
  sendNowSucceeded: 'api:scheduled-message:send-now:success',
  sentNow: 'api:scheduled-message:create:sent-now',
  stillSending: 'validation:scheduled-message:still-sending',
} as const;

export const SCHEDULED_MESSAGES_EMITTER = 'ScheduledMessages';

export const SCHEDULE_MESSAGE_CAPABILITY = 'schedule-message';

export const RESCHEDULED_MESSAGE_FIELDS = [
  'attachments',
  'custom',
  'mentioned_channel',
  'mentioned_group_ids',
  'mentioned_here',
  'mentioned_roles',
  'mentioned_users',
  'parent_id',
  'poll_id',
  'quoted_message_id',
  'restricted_visibility',
  'show_in_channel',
  'silent',
  'text',
] as const;
