/**
 * Hand-maintained bundled data for keys with no inline English copy at the call site:
 * `timestamp.*` and `duration.*` (formatter expressions passed as prop values) and
 * `translationBuilderTopic.*` (an i18next postProcessor directive). The `language.*` names come
 * from `stream-chat`.
 *
 * Eight `timestamp.*` entries (`DateSeparator`, `ReminderNotification`, `ChannelPreviewTimestamp`,
 * `ChannelDetailPinnedMessageTimestamp`, `ScheduledMessageConfirmation`, `ScheduledMessageGroup`,
 * `ScheduledMessageSendTime`, `SchedulePreset`) hold English words in their formats, which
 * `dayjsLocaleConfigForLanguage` does not reach, so integrators override the key. Adding a ninth
 * fails a guard in `__tests__/Streami18n.test.ts` that keeps the migration guide's list in sync.
 */
export const runtimeDefaults = {
  'duration.messageReminder': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'duration.remindMe': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'duration.shareLocation': '{{ milliseconds | durationFormatter }}',
  'timestamp.ChannelDetailPinnedMessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Yesterday]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.ChannelMembersLastActive':
    '{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactWeekRounding: ceil) }}',
  'timestamp.ChannelPreviewTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Yesterday]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.DateSeparator':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today]", "nextDay": "[Tomorrow]", "lastDay": "[Yesterday]", "nextWeek": "dddd", "lastWeek": "[Last] dddd", "sameElse": "ddd, D MMM" }) }}',
  // Without `calendarFormats` the dayjs locale supplies the wording, so
  // `dayjsLocaleConfigForLanguage` translates these.
  'timestamp.GalleryTimestamp': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.LiveLocation': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: false; format: HH:mm) }}',
  'timestamp.PollVote':
    '{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactWeekRounding: ceil) }}',
  'timestamp.PollVoteTooltip': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.ReminderNotification':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today] [at] HH:mm", "nextDay": "[Tomorrow] [at] HH:mm", "lastDay": "[Yesterday] [at] HH:mm", "nextWeek": "dddd [at] HH:mm", "lastWeek": "[Last] dddd [at] HH:mm", "sameElse": "ddd, D MMM [at] HH:mm" }) }}',
  'timestamp.ScheduleDate':
    '{{ timestamp | timestampFormatter(format: ddd, MMM D, YYYY) }}',
  'timestamp.ScheduledMessageConfirmation':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "HH:mm", "nextDay": "ddd, MMM D [at] HH:mm", "lastDay": "ddd, MMM D [at] HH:mm", "nextWeek": "ddd, MMM D [at] HH:mm", "lastWeek": "ddd, MMM D [at] HH:mm", "sameElse": "ddd, MMM D [at] HH:mm" }) }}',
  'timestamp.ScheduledMessageGroup':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today]", "nextDay": "[Tomorrow]", "lastDay": "[Yesterday]", "nextWeek": "dddd", "lastWeek": "[Last] dddd", "sameElse": "ddd, D MMM" }) }}',
  'timestamp.ScheduledMessageSendTime':
    '{{ timestamp | timestampFormatter(format: ddd, MMM D [at] HH:mm) }}',
  'timestamp.SchedulePreset':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today] [at] HH:mm", "nextDay": "[Tomorrow] [at] HH:mm", "lastDay": "[Yesterday] [at] HH:mm", "nextWeek": "dddd [at] HH:mm", "lastWeek": "[Last] dddd [at] HH:mm", "sameElse": "dddd [at] HH:mm" }) }}',
  'timestamp.SystemMessage': '{{ timestamp | timestampFormatter(format: dddd L) }}',
  'translationBuilderTopic.notification': '{{value, notification}}',
};
