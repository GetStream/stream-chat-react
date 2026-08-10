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
[`i18n-v15-key-map.json`](./i18n-v15-key-map.json):

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
override stops applying and the English copy renders instead — no error.

Typing the dictionary as `TranslationDictionary` turns that silent failure into a compile error:

```ts
const de: TranslationDictionary = {
  'common.cancel.label': 'Abbrechen',
  Cancel: 'Abbrechen', // ← v14 key: compile error, exactly what you want here
};
```

Widen to `LooseTranslationDictionary` only where you need keys of your own, or the extra plural
categories some languages use (`_few`, `_many`, `_zero`) — it admits any key, so nothing catches a
stale one there.

> Do **not** key a dictionary on `Partial<Record<TranslationKey, string>>`. `TranslationKey` is the
> set `t()` accepts, where a plural is the bare `<key>`; a dictionary needs the `_one` / `_other`
> entries, which that type rejects. `TranslationDictionary` already handles this.

## Discovering the keys

- **`TranslationDictionary`** — the one to reach for: every SDK key including the `_one` /
  `_other` plural forms, and nothing else. A typo or a stale v14 key is a compile error.
- **`LooseTranslationDictionary`** — the same, plus any key you like. What
  `registerTranslation()` and `translationsForLanguage` accept, so one instance can also carry your
  app's own copy and extra plural categories. Nothing catches a stale key here.
- **`TranslationKey`** — the union `t()` accepts (a plural appears as the bare key). Use it to type
  a `t` parameter; it is not the right key type for a dictionary.
- **`TranslationCatalog`** — every key mapped to its English copy, exported from
  `stream-chat-react`. Type-only, so it adds nothing to your bundle; hover a key to see what it
  renders, or index it (`TranslationCatalog['common.cancel.label']` is `'Cancel'`).
- **A JSON catalog** — every key with its English copy, which is the file to hand to translators.
  The SDK does not check one in (the copy lives inline at each `t()` call site, so a committed
  catalog would be a duplicate that can go stale). Generate it from a clone with:

  ```bash
  yarn i18n:export
  ```

  That writes `en.json` in the repo root. `ai-docs/i18n-v15-key-map.json` also lists every key,
  alongside the v14 string it replaced.

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

The exception is the ~71 keys that carry no inline copy — `timestamp.*` and `duration.*` (formatter
expressions), `language.*` (built from a runtime language code), and the postProcessor directive.
Those are bundled in `runtimeDefaults` instead, and both `registerTranslation()` and
`translationsForLanguage` merge your dictionary over them, so you inherit the working defaults
without listing them. You only need to supply one if you want a different date format.
