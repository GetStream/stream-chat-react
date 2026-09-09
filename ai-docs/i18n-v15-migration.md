# i18n changes in v15

Three breaking changes, all in v15:

1. **English is the only bundled language.** The `de`, `es`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`,
   `pt`, `ru` and `tr` dictionaries are gone, along with their `dayjs` locale data.
2. **Translation keys are namespaced identifiers**, not the English text. `t('Send Message')`
   became `t('messageComposer.sendButton.send.ariaLabel', 'Send')`.
3. **The translation runtime moved into `stream-chat`**, shared with the React Native SDK. The class
   keeps its name, two of its methods changed shape, and two timestamp edge cases render differently
   — see [The shared runtime](#the-shared-runtime).

Together these cut ~112 KB gzip (27%) from the bundle: the 11 dictionaries were statically
imported and copied into `Streami18n` at construction, so they shipped even if you never set
`language`.

## Do I need to do anything?

| If you…                                          | Action                                         |
| ------------------------------------------------ | ---------------------------------------------- |
| use the SDK in English and never touched i18n    | **Nothing.**                                   |
| passed `translationsForLanguage`                 | Rename your keys — see below                   |
| called `registerTranslation()`                   | Rename your keys — see below                   |
| used a built-in non-English language             | Supply the dictionary yourself — see below     |
| relied on non-English date formats               | Import the `dayjs` locale yourself — see below |
| imported `deTranslations` … `trTranslations`     | Those exports are removed                      |
| construct `new Streami18n(...)`                  | **Nothing** — same name, same options object   |
| assign `i18n.t` or read `setLanguage()`'s return | Both changed — see below                       |
| declared `i18next` or `dayjs` yourself           | You can drop them; `stream-chat` supplies both |

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

/** Formatter keys hold `dayjs` / `i18next` expressions, not copy, so they are not "translated". */
type TranslatableKey = Exclude<
  keyof TranslationCatalog,
  `duration.${string}` | `timestamp.${string}` | `translationBuilderTopic.${string}`
>;

/** Every key still needing German. Hover it to read the list. */
type Untranslated = Exclude<TranslatableKey, keyof typeof de>;
```

`language.*` (ISO language names) and `relativeTime.*` are ordinary copy and stay in the diff — they
render in the UI like anything else, so a complete language translates them too.

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

## The shared runtime

`Streami18n` used to live in this package. It now lives in `stream-chat` and is shared with
`stream-chat-react-native`, so both SDKs behave identically and a fix reaches both at once. You still
import it from here, and it still carries this SDK's own key catalog and copy.

### `getTranslators()` is now `init()`

Same return value; the old name was a getter that initialized, which is what made it worth renaming.

```ts
// v14
const { t, tDateTimeParser } = await i18n.getTranslators();

// v15
const { t, tDateTimeParser } = await i18n.init();
```

`init()` is idempotent and safe to call concurrently — the promise is memoized, which closes a
re-entry window the old implementation left open.

### `t` is read-only, and `setLanguage()` returns nothing

`t` is published through a reactive store rather than being a mutable field, which is what lets
`<Chat>` pick up a language change without remounting. Two consequences:

```ts
// v14 — assigning `t` directly
(i18n as any).t = myTranslator;

// v15 — publish it, and every subscriber updates
i18n.overrideTFunction(myTranslator);
```

```ts
// v14 — setLanguage returned a translator (sometimes; it had three return shapes)
const t = await i18n.setLanguage('de');

// v15 — it returns void. Read the current `t` from the instance, or let <Chat> re-render.
await i18n.setLanguage('de');
const { t } = i18n.state.getLatestValue();
```

The returned translator was removed deliberately: it went stale on the next language change, so
holding onto it was always a latent bug.

### `getTranslations()` and `getAvailableLanguages()` are gone

Both were public in v14, both leaked internal bookkeeping, and neither had a consumer in this SDK.

```ts
// v14 — reading the raw i18next resource map
i18n.getTranslations().en.translation['some.key'];

// v15 — render the key instead; that is the thing you actually wanted to know
i18n.t('some.key');
```

`getTranslations()` never held this SDK's English copy in the first place: prose renders from the
inline `defaultValue` at each call site, so the resource map only ever contained the bundled formatter
expressions plus whatever had been registered.

```ts
// v14 — "available" included languages created only to carry the bundled defaults,
// so a language nobody registered showed up here
i18n.getAvailableLanguages().includes('de');

// v15
i18n.registeredLanguages.has('de');
```

`registeredLanguages` is now a `ReadonlySet<string>`. Reading it is unchanged; `.add()` no longer
compiles — use `registerTranslation()`, since adding to the set would claim a language is registered
with no dictionary behind it.

Also now internal, none of them documented before: `translations`, `dayjsLocales`,
`isCustomDateTimeParser`, `localeExists()`, `addOrUpdateLocale()`, `validateCurrentLanguage()`. To
register a dayjs locale directly, `stream-chat/i18n` exports `addOrUpdateDayjsLocale()`.

### `useChat` no longer returns `translators`

The i18n wiring moved out of `useChat` into a dedicated `useStreami18n`, matching the hook
`stream-chat-react-native` already had. `useChat` was doing five unrelated jobs — user-agent stamping,
subsystem subscriptions, mutes, i18n and latest-message bookkeeping — and only held the translators to
hand them straight to a provider.

`useChat` is exported, so if you called it directly:

```ts
// v14
const { translators } = useChat({ client, defaultLanguage, i18nInstance });

// v15
const { getAppSettings, latestMessageDatesByChannels, mutes } = useChat({ client });
const translators = useStreami18n({ client, i18nInstance });
```

`useChat` no longer takes `i18nInstance`, which moved to `useStreami18n`. `defaultLanguage` is gone
from both, and from `<Chat>` — see below.

### `defaultLanguage` is removed, and so is browser detection

`<Chat defaultLanguage>` read as a fallback for UI translations, but it never drove them: the
`Streami18n` instance does. All it fed was `userLanguage`, which is the key the SDK reads
`message.i18n[<lang>_text]` with — and a fallback there cannot help, because with no
`client.user.language` the API is not translating at all, so `message.i18n` is absent and the text
falls through to `message.text` regardless.

For the same reason `userLanguage` no longer falls back to the two-letter browser language when that
language happens to have a registered dictionary. Having German UI copy says nothing about whether the
API produces `message.i18n.de_text`, so that branch only ever produced lookups that missed.
`stream-chat-react-native` never had it.

`userLanguage` is now `client.user.language` and nothing else, which is what every one of its consumers
already assumed. A non-English UI comes from registering a dictionary and setting `language` on the
instance; translated messages come from `language` in `connectUser`. The two are independent.

One behavioural improvement comes with it. `userLanguage` tracks `client.user.language` reactively, so
a language changed after connect now reaches the message components — it used to be read as a `useMemo`
dependency with no subscription, so it only refreshed if something else re-rendered. Passing a value
that is not a `Streami18n` warns and falls back to a default instance rather than throwing at render.

### You no longer need `i18next` or `dayjs` in your own dependencies

`stream-chat` depends on both, so they arrive transitively. If you declared them only for this SDK,
remove them — and if you keep them, **match `stream-chat`'s ranges**. Two copies of `dayjs` means
your `import 'dayjs/locale/de'` registers the locale on a different instance than the one formatting
dates, and dates silently stay English:

```bash
find . -maxdepth 4 -name dayjs -type d -path '*node_modules*'   # expect exactly one
```

## Date and time

> **Before anything on this page:** every timestamp you hand a formatter is now a unix-**nanosecond**
> number, and the `t('timestamp.X', { timestamp })` path is **not type-checked** — i18next's
> interpolation bag is untyped, so a raw wire number compiles and renders the literal text
> `Invalid Date`. `getDateString`'s `messageCreatedAt` _is_ typed (`string | Date`). If a timestamp is
> rendering wrong or blank, check the conversion first; see
> [Dates on response types are unix-nanosecond numbers](./ai-migration-v14-v15.md#dates-on-response-types-are-unix-nanosecond-numbers).

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

### Two edge cases render differently

Both are confined to a `timestamp.*` key that specifies **no** format. Every key the SDK ships
specifies one (`format: HH:mm`, `calendar: true`, and so on), so you only see these if you overrode a
timestamp key with an expression that formats nothing.

**A `null` or unparseable timestamp renders as empty**, where v14 rendered the value stringified —
which for `null` was the literal text `null`:

```ts
// a key with no format
'timestamp.MessageTimestamp': '{{ timestamp | timestampFormatter(calendar: false) }}'

// t('timestamp.MessageTimestamp', { timestamp: null })
// v14 →  "null"
// v15 →  ""
```

The same applies when you call `predefinedFormatters.timestampFormatter` yourself: it returns `''`
rather than the stringified value. If you relied on that to spot a missing timestamp during
development, check for the empty string instead — rendering the word `null` into a message list was
never intentional.

Note this is specifically about a value that _reaches_ the formatter. Passing no `timestamp` at all
leaves i18next with nothing to interpolate, so the raw expression comes through unchanged — that was
true in v14 too, and is a sign the option name is misspelled at the call site.

**Unformatted output carries a numeric offset rather than `Z`:**

```ts
// v14 →  2019-04-03T14:42:47Z
// v15 →  2019-04-03T14:42:47+00:00
```

Same instant, different ISO spelling. v14 called dayjs's `.tz()` on every parse even when no
`timezone` was configured, which marks the instance as zoned and changes how `.format()` with no
template renders. v15 applies `.tz()` only when you actually set `timezone`, matching what the React
Native SDK already did. Configure a `format` on the key if you need a specific shape — relying on
dayjs's default is fragile either way.

## Why keys changed at all

The old keys _were_ the English copy, which meant:

- 375 of 706 entries were `"X": "X"` duplication.
- Any copy edit silently orphaned every translation, because the key changed with the text.
- The same word in different contexts could not be disambiguated. The codebase had already grown an
  ad-hoc `aria/` prefix to work around exactly this.

Keys are now stable, and the English copy travels inline at the call site as i18next's
`defaultValue`. That keeps the copy readable where it is used, and means a key you do not supply
still renders English rather than a raw key path.

The exception is the 15 keys that carry no inline copy — `timestamp.*` and `duration.*` (formatter
expressions) and the postProcessor directive. Those are bundled in `runtimeDefaults` instead, and both
`registerTranslation()` and `translationsForLanguage` merge your dictionary over them, so you inherit
the working defaults without listing them. You only need to supply one if you want a different date
format.

Two more sets are still overridable but now come from `stream-chat`, because it owns the code that
renders them:

- **`language.*`** — the 57 language names used to say "Translated from German" on an auto-translated
  message. They are derived from the same language union the API uses, so the set can no longer drift
  out of sync with it.
- **`relativeTime.*`** — `Today`, `Yesterday`, `{{ count }}d ago`, `{{ count }}w ago`, used by
  `timestampFormatter(relativeCompact: true)`.

Both are part of your catalog's types, so you override them exactly as before — `t('language.de')` is
a checked key, and a typo in either is still a compile error.
