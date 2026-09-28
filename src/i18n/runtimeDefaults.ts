/**
 * The only translation data bundled with the SDK. Hand-maintained.
 *
 * Prose keys are not here — they pass their English copy inline at the call site
 * (`t('message.status.sent.text', 'Sent')`). These keys have no inline copy to fall back on:
 *
 * - `language.*` — the key is built from a runtime language code
 * - `timestamp.*`, `duration.*` — formatter expressions, passed around as prop values
 * - `translationBuilderTopic.*` — an i18next postProcessor directive
 *
 * `yarn build-translations` joins this file with the inline defaults to generate
 * `src/i18n/keys.ts`; `yarn i18n:export` writes the joined catalog as JSON.
 *
 * Four `timestamp.*` entries carry English day words inside their `calendarFormats` argument —
 * `DateSeparator`, `ReminderNotification`, `ChannelPreviewTimestamp`,
 * `ChannelDetailPinnedMessageTimestamp`. Integrators translate those by overriding the key;
 * `dayjsLocaleConfigForLanguage` does not reach them. Adding a fifth fails a guard in
 * `__tests__/Streami18n.test.ts` that keeps `ai-docs/i18n-v15-migration.md` in sync.
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
  // No `calendarFormats` override, so the dayjs locale supplies the calendar wording and the key
  // stays translatable via `dayjsLocaleConfigForLanguage`.
  'timestamp.GalleryTimestamp': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.LiveLocation': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: false; format: HH:mm) }}',
  'timestamp.PollVote':
    '{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactWeekRounding: ceil) }}',
  'timestamp.PollVoteTooltip': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.ReminderNotification':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today] [at] HH:mm", "nextDay": "[Tomorrow] [at] HH:mm", "lastDay": "[Yesterday] [at] HH:mm", "nextWeek": "dddd [at] HH:mm", "lastWeek": "[Last] dddd [at] HH:mm", "sameElse": "ddd, D MMM [at] HH:mm" }) }}',
  'timestamp.SystemMessage': '{{ timestamp | timestampFormatter(format: dddd L) }}',
  'translationBuilderTopic.notification': '{{value, notification}}',
};
