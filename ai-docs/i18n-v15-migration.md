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

Widen to `LooseTranslationDictionary` only where you need keys of your own — it admits any key, so
nothing catches a stale one there. The extra plural categories some languages use (`_few`, `_many`,
`_zero`) do **not** need it; `TranslationDictionary` accepts those already.

> Do **not** key a dictionary on `Partial<Record<TranslationKey, string>>`. `TranslationKey` is the
> set `t()` accepts, where a plural is the bare `<key>`; a dictionary needs the `_one` / `_other`
> entries, which that type rejects. `TranslationDictionary` already handles this.

## Discovering the keys

- **`TranslationDictionary`** — the one to reach for: every SDK key, including the plural forms, and
  nothing else. A typo or a stale v14 key is a compile error. A plural key takes any category
  `Intl.PluralRules` can select, so `_few` / `_many` / `_zero` are checked too; a plural suffix on a
  key that is not plural is rejected.
- **`LooseTranslationDictionary`** — the same, plus any key you like, so one instance can also carry
  your app's own copy and extra plural categories. Nothing catches a stale key here. Opt in by
  annotating the variable you pass; `registerTranslation()` and `translationsForLanguage` take
  `TranslationDictionary`, so a key typed inline is checked:

  ```ts
  i18n.registerTranslation('de', { 'common.cancel.lable': 'Abbrechen' }); // ← compile error

  const withOwnKeys: LooseTranslationDictionary = { 'myApp.somethingElse': 'Hallo' };
  i18n.registerTranslation('de', withOwnKeys); // ← fine
  ```

- **`TranslationKey`** — the union `t()` accepts (a plural appears as the bare key). Use it to type
  a `t` parameter; it is not the right key type for a dictionary.
- **`TranslationCatalog`** — every key mapped to its English copy, exported from
  `stream-chat-react`. Type-only, so it adds nothing to your bundle; hover a key to see what it
  renders, or index it (`TranslationCatalog['common.cancel.label']` is `'Cancel'`).
- **A JSON catalog** — the file to hand to translators. The SDK does not check one in (the copy
  lives inline at each `t()` call site, so a committed catalog would be a duplicate that can go
  stale). Generate it from a clone with:

  ```bash
  yarn i18n:export
  ```

  That writes `en.json` in the repo root with the 619 translatable keys. The 14 `timestamp.*`,
  `duration.*` and `translationBuilderTopic.*` entries are left out on purpose — they are dayjs and
  i18next expressions, and a TMS that "translates" `{{value, notification}}` breaks notifications
  outright. Four of them do carry English day words; those are handled by overriding the key, see
  [Date and time](#date-and-time). Pass `--all` for the complete 633-key catalog.

  `ai-docs/i18n-v15-key-map.json` also lists every key, alongside the v14 string it replaced.

Keys are namespaced after the source tree, so they are predictable from the component:
`message.*`, `messageComposer.*`, `poll.*`, `channelList.*`, with genuinely shared copy under
`common.*`. The last segment is the modality: `.label`, `.ariaLabel`, `.placeholder`, `.title`,
`.description`, `.text`.

### Plurals

The SDK's own copy only needs `<key>_one` / `<key>_other`. Supply whichever categories your language
needs — i18next selects between them with `Intl.PluralRules`, so Russian or Arabic can add `_few`,
`_many` and `_zero` and still have every key checked:

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

Most of them only need overriding to change _how_ a date is formatted. **Four of them also carry
English words**, because dayjs takes the calendar wording as part of the format string:

| Key                                             | English baked into `calendarFormats`           |
| ----------------------------------------------- | ---------------------------------------------- |
| `timestamp.DateSeparator`                       | `Today`, `Tomorrow`, `Yesterday`, `Last`       |
| `timestamp.ReminderNotification`                | `Today`, `Tomorrow`, `Yesterday`, `Last`, `at` |
| `timestamp.ChannelPreviewTimestamp`             | `Yesterday`                                    |
| `timestamp.ChannelDetailPinnedMessageTimestamp` | `Yesterday`                                    |

Translating those four means overriding the key itself — `dayjsLocaleConfigForLanguage` does not
reach them. See [Date and time](#date-and-time) for the how and why.

`relativeTime.*` ("Today", "{{ count }}d ago") is ordinary copy and translates normally, as does
everything else.

## Keeping a language up to date across upgrades

When a later SDK release adds a key, **your build stays green.** `TranslationDictionary` is
`Partial`, so nothing is required; the new string renders its inline English until you translate it.
That is deliberate — a partial dictionary is always safe, and no key ever renders as a raw dotted
path — but it does mean new copy arrives untranslated without telling you.

To be told, diff your dictionary against the catalog at the type level. Declare it `as const` so
TypeScript keeps the literal keys, then `Exclude` them from the catalog:

```ts
import type { TranslationCatalog, TranslationDictionary } from 'stream-chat-react';

export const de = {
  'common.cancel.label': 'Abbrechen',
  'common.back.label': 'Zurück',
} as const satisfies TranslationDictionary;

/** Every key still needing German. Hover it to read the list. */
type Untranslated = Exclude<keyof TranslationCatalog, keyof typeof de>;
```

Hovering `Untranslated` in your editor lists the missing keys, and it shrinks as you add them. To
turn "am I complete?" into a build failure — useful in CI after a dependency bump — assert the diff
is empty:

```ts
type AssertEmpty<T extends never> = T;
type TranslationsComplete = AssertEmpty<Untranslated>;
// ^ compile error naming a missing key until `de` covers the whole catalog
```

`satisfies` is doing real work here: it still type-checks every key against the catalog (so a typo
is an error) while `as const` preserves the literal keys that `keyof typeof de` needs. Using a plain
`: TranslationDictionary` annotation would widen `keyof typeof de` to the whole catalog and the diff
would always be empty.

One caveat: there is no _runtime_ list of keys to diff against — `TranslationCatalog` is a type,
which is what keeps the typed surface free at runtime. So this check is compile-time only; a script
cannot ask the installed package "which keys exist?".

Extra plural categories are safe here: they are accepted by `TranslationDictionary` but are not
catalog keys, so they neither break the `satisfies` check nor shrink the diff.

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
