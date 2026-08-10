# i18n changes in v15

Two breaking changes, both in v15:

1. **English is the only bundled language.** The `de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`,
   `pt`, `ru` and `tr` dictionaries are gone, along with their `dayjs` locale data.
2. **Translation keys are namespaced identifiers**, not the English text. `t('Send Message')`
   became `t('messageComposer.sendButton.send.ariaLabel', 'Send')`.

Together these cut ~112 KB gzip (27%) from the bundle: the 11 dictionaries were statically
imported and copied into `Streami18n` at construction, so they shipped even if you never set
`language`.

## Do I need to do anything?

| If you…                                       | Action                                         |
| --------------------------------------------- | ---------------------------------------------- |
| use the SDK in English and never touched i18n | **Nothing.**                                   |
| passed `translationsForLanguage`              | Rename your keys — see below                   |
| called `registerTranslation()`                | Rename your keys — see below                   |
| used a built-in non-English language          | Supply the dictionary yourself — see below     |
| relied on non-English date formats            | Import the `dayjs` locale yourself — see below |
| imported `deTranslations` … `trTranslations`  | Those exports are removed                      |

## Renaming your keys

Every old key maps to exactly one new key. The full table (603 rows) is
[`scripts/i18n-migration/key-map.json`](../scripts/i18n-migration/key-map.json):

```json
{
  "keys": {
    "Cancel": { "key": "common.cancel.label", "prose": true },
    "aria/Send": { "key": "messageComposer.sendButton.send.ariaLabel", "prose": true },
    "{{ count }} members": {
      "key": "channelDetail.channelMembersView.members.title",
      "prose": true,
      "plural": true
    },
    "giphy-command-args": { "key": "command.giphy.args", "prose": true },
    "language/de": { "key": "language.de", "prose": true },
    "timestamp/MessageTimestamp": { "key": "timestamp.MessageTimestamp", "prose": false }
  }
}
```

Before:

```ts
i18n.registerTranslation('de', {
  Cancel: 'Abbrechen',
  'aria/Send': 'Senden',
  '{{ count }} members_one': '{{ count }} Mitglied',
  '{{ count }} members_other': '{{ count }} Mitglieder',
});
```

After:

```ts
import type { TranslationDictionary } from 'stream-chat-react';

const de: TranslationDictionary = {
  'common.cancel.label': 'Abbrechen',
  'messageComposer.sendButton.send.ariaLabel': 'Senden',
  'channelDetail.channelMembersView.members.title_one': '{{ count }} Mitglied',
  'channelDetail.channelMembersView.members.title_other': '{{ count }} Mitglieder',
};

i18n.registerTranslation('de', de);
```

**Renaming is not optional and it fails quietly.** An old key simply never matches, so your
override stops applying and the English copy renders instead — no error. Type your dictionary as
`TranslationDictionary` (or `Partial<Record<TranslationKey, string>>` for strict checking) and
TypeScript will flag the stale keys for you.

## Discovering the keys

- **`TranslationKey`** — a union of all 633 keys, exported from `stream-chat-react`. Autocompletes
  in any editor.
- **`TranslationDictionary`** — what `registerTranslation()` takes. Known keys are autocompleted
  and spell-checked; unknown keys are allowed so you can register copy for your own components
  through the same instance.
- **`Partial<Record<TranslationKey, string>>`** — use this instead if you want unknown keys
  rejected outright.
- **[`src/i18n/en.json`](../src/i18n/en.json)** — every key with its English copy. This is the file
  to hand to translators.

Keys are namespaced after the source tree, so they are predictable from the component:
`message.*`, `messageComposer.*`, `poll.*`, `channelList.*`, with genuinely shared copy under
`common.*`. The last segment is the modality: `.label`, `.ariaLabel`, `.placeholder`, `.title`,
`.description`, `.text`.

### Plurals

Plural entries are stored as `<key>_one` / `<key>_other`. Supply whichever categories your language
needs — i18next selects between them with `Intl.PluralRules`, so Russian or Arabic can add `_few`,
`_many` and `_zero`:

```ts
i18n.registerTranslation('ru', {
  'channelDetail.channelMembersView.members.title_one': '{{ count }} участник',
  'channelDetail.channelMembersView.members.title_few': '{{ count }} участника',
  'channelDetail.channelMembersView.members.title_many': '{{ count }} участников',
});
```

### Keys that are not copy

Entries with `"prose": false` — `timestamp.*`, `duration.*`, `translationBuilderTopic.*` — hold
formatter expressions, not text:

```json
"timestamp.MessageTimestamp": "{{ timestamp | timestampFormatter(calendar: false; format: HH:mm) }}"
```

Override them to change _how_ a date is formatted, not to translate anything. `relativeTime.*`
("Today", "{{ count }}d ago") is ordinary copy and does need translating.

## Supplying a language the SDK used to ship

The last published dictionaries are in git history. To recover one:

```bash
git show v14.11.0:src/i18n/de.json > de.json
```

Then rename its keys with the mapping table above and register it. Note the old file's keys are the
_old_ natural-language keys, so it needs the same rename as your own overrides.

## Date and time

Only the `en` dayjs locale is bundled, and the per-language `calendar` formats the SDK used to ship
are gone. For any other language, import the locale and supply the calendar config:

```ts
import 'dayjs/locale/de.js';

const i18n = new Streami18n({
  language: 'de',
  dayjsLocaleConfigForLanguage: {
    calendar: {
      sameDay: '[heute um] LT',
      lastDay: '[gestern um] LT',
      lastWeek: '[letzten] dddd [um] LT',
      nextDay: '[morgen um] LT',
      nextWeek: 'dddd [um] LT',
      sameElse: 'L',
    },
  },
});
```

Or pass your own preconfigured `DateTimeParser` (dayjs or moment).

## Why keys changed at all

The old keys _were_ the English copy, which meant:

- 375 of 706 entries were `"X": "X"` duplication.
- Any copy edit silently orphaned every translation, because the key changed with the text.
- The same word in different contexts could not be disambiguated. The codebase had already grown an
  ad-hoc `aria/` prefix to work around exactly this.

Keys are now stable, and the English copy travels inline at the call site as i18next's
`defaultValue`. That keeps the copy readable where it is used, and means a key you do not supply
still renders English rather than a raw key path.
