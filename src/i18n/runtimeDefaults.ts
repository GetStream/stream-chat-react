/**
 * The only translation data bundled with the SDK. Edit this file by hand.
 *
 * Every *prose* key passes its English copy inline at the call site
 * (`t('message.status.sent.text', 'Sent')`), so i18next renders it from that `defaultValue` and
 * the string never ships as data. The keys below have no inline copy to fall back on:
 *
 * - `language.*` — the key is built from a runtime language code
 * - `timestamp.*`, `duration.*` — formatter expressions, passed around as prop values
 * - `translationBuilderTopic.*` — an i18next postProcessor directive
 *
 * Together with those inline defaults, this file *is* the catalog: `yarn build-translations`
 * joins the two to generate `src/i18n/keys.ts`, and fails if a key is called with no inline
 * default and no entry here (it would render as the raw dotted key), or if a key appears in both
 * (the bundled value wins, so the call site would silently have no effect).
 *
 * `yarn i18n:export` writes the full catalog out as JSON, for a translator or a TMS.
 */
export const runtimeDefaults = {
  'duration.messageReminder': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'duration.remindMe': '{{ milliseconds | durationFormatter(withSuffix: true) }}',
  'duration.shareLocation': '{{ milliseconds | durationFormatter }}',
  'language.af': 'Afrikaans',
  'language.am': 'Amharic',
  'language.ar': 'Arabic',
  'language.az': 'Azerbaijani',
  'language.bg': 'Bulgarian',
  'language.bn': 'Bengali',
  'language.bs': 'Bosnian',
  'language.cs': 'Czech',
  'language.da': 'Danish',
  'language.de': 'German',
  'language.el': 'Greek',
  'language.en': 'English',
  'language.es': 'Spanish',
  'language.es-MX': 'Spanish (Mexico)',
  'language.et': 'Estonian',
  'language.fa': 'Persian',
  'language.fa-AF': 'Dari',
  'language.fi': 'Finnish',
  'language.fr': 'French',
  'language.fr-CA': 'French (Canada)',
  'language.ha': 'Hausa',
  'language.he': 'Hebrew',
  'language.hi': 'Hindi',
  'language.hr': 'Croatian',
  'language.ht': 'Haitian Creole',
  'language.hu': 'Hungarian',
  'language.id': 'Indonesian',
  'language.it': 'Italian',
  'language.ja': 'Japanese',
  'language.ka': 'Georgian',
  'language.ko': 'Korean',
  'language.lt': 'Lithuanian',
  'language.lv': 'Latvian',
  'language.ms': 'Malay',
  'language.nl': 'Dutch',
  'language.no': 'Norwegian',
  'language.pl': 'Polish',
  'language.ps': 'Pashto',
  'language.pt': 'Portuguese',
  'language.ro': 'Romanian',
  'language.ru': 'Russian',
  'language.sk': 'Slovak',
  'language.sl': 'Slovenian',
  'language.so': 'Somali',
  'language.sq': 'Albanian',
  'language.sr': 'Serbian',
  'language.sv': 'Swedish',
  'language.sw': 'Swahili',
  'language.ta': 'Tamil',
  'language.th': 'Thai',
  'language.tl': 'Tagalog',
  'language.tr': 'Turkish',
  'language.uk': 'Ukrainian',
  'language.ur': 'Urdu',
  'language.vi': 'Vietnamese',
  'language.zh': 'Chinese (Simplified)',
  'language.zh-TW': 'Chinese (Traditional)',
  'timestamp.ChannelDetailPinnedMessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Yesterday]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.ChannelMembersLastActive':
    '{{ timestamp | timestampFormatter(relativeCompact: true) }}',
  'timestamp.ChannelPreviewTimestamp':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "LT", "lastDay": "[Yesterday]", "lastWeek": "dddd", "sameElse": "L" }) }}',
  'timestamp.DateSeparator':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today]", "nextDay": "[Tomorrow]", "lastDay": "[Yesterday]", "nextWeek": "dddd", "lastWeek": "[Last] dddd", "sameElse": "ddd, D MMM" }) }}',
  'timestamp.LiveLocation': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.MessageTimestamp':
    '{{ timestamp | timestampFormatter(calendar: false; format: HH:mm) }}',
  'timestamp.PollVote': '{{ timestamp | timestampFormatter(relativeCompact: true) }}',
  'timestamp.PollVoteTooltip': '{{ timestamp | timestampFormatter(calendar: true) }}',
  'timestamp.ReminderNotification':
    '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: { "sameDay": "[Today] [at] HH:mm", "nextDay": "[Tomorrow] [at] HH:mm", "lastDay": "[Yesterday] [at] HH:mm", "nextWeek": "dddd [at] HH:mm", "lastWeek": "[Last] dddd [at] HH:mm", "sameElse": "ddd, D MMM [at] HH:mm" }) }}',
  'timestamp.SystemMessage': '{{ timestamp | timestampFormatter(format: dddd L) }}',
  'translationBuilderTopic.notification': '{{value, notification}}',
};
