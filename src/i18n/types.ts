import type { Streami18n } from './Streami18n';
import type Dayjs from 'dayjs';
import type { Moment } from 'moment-timezone';
import type { MessageContextValue } from '../context';
import type { TOptions } from 'i18next';
import type { TranslationCatalog } from './keys';

type Whitespace = ' ' | '\n' | '\t';
type Trim<S extends string> = S extends `${Whitespace}${infer R}`
  ? Trim<R>
  : S extends `${infer R}${Whitespace}`
    ? Trim<R>
    : S;

/** `{{ value, formatter }}` and `{{ value | formatter(...) }}` — the name is the leading part. */
type VarName<S extends string> = Trim<
  S extends `${infer Name},${string}`
    ? Name
    : S extends `${infer Name}|${string}`
      ? Name
      : S
>;

/**
 * The interpolation variables a copy string requires.
 *
 * i18next ships `InterpolationMap`, but it does not trim the placeholder, so `{{ setting }}`
 * yields a property literally named `" setting "`. The SDK's copy uses spaced placeholders
 * throughout, so we parse them ourselves.
 */
type InterpolationVars<S extends string> =
  S extends `${string}{{${infer V}}}${infer Rest}`
    ? (VarName<V> extends '' ? never : VarName<V>) | InterpolationVars<Rest>
    : never;

type InterpolationArgs<S extends string> = [InterpolationVars<S>] extends [never]
  ? Record<never, never>
  : { [K in InterpolationVars<S>]: number | string };

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
type CatalogKey = keyof TranslationCatalog & string;

/**
 * Keys whose catalog entries are plural forms (`<key>_one` / `<key>_other`). Call sites use the
 * bare key and pass `count`; the suffixed forms are never referenced directly.
 */
export type PluralTranslationKey = CatalogKey extends infer K
  ? K extends `${infer Base}_other`
    ? Base
    : never
  : never;

/**
 * Every key the SDK's `t` accepts: the singular entries plus the bare handle for each plural.
 *
 * This is the *call-site* key set — use it to type a `t` parameter. It is deliberately **not** the
 * right type for a dictionary: a plural lives in the catalog as `<key>_one` / `<key>_other` while
 * `t()` takes the bare `<key>`, so keying a dictionary on this rejects the very entries a
 * translator has to supply. Use {@link TranslationDictionary} for that.
 */
export type TranslationKey =
  | Exclude<CatalogKey, `${string}_${PluralSuffix}`>
  | PluralTranslationKey;

/**
 * A translation dictionary for `Streami18n.registerTranslation()` / `translationsForLanguage`.
 *
 * Restricted to the SDK's own keys, so a typo or a leftover v14 key is a compile error rather than
 * an override that silently never applies. Keyed on the catalog rather than on
 * {@link TranslationKey}, so the `_one` / `_other` plural entries are accepted.
 *
 * The SDK's own copy only needs `_one` / `_other`, but a plural key accepts every category
 * `Intl.PluralRules` can select, so Russian or Arabic can supply `_few`, `_many` and `_zero` and
 * still have its keys checked. A plural suffix on a key that is not plural is rejected.
 *
 * Widen to {@link LooseTranslationDictionary} only when you need keys the SDK does not define.
 *
 * @example
 * const de: TranslationDictionary = {
 *   'common.cancel.label': 'Abbrechen',
 *   'channelDetail.channelMembersView.members.title_one': '{{ count }} Mitglied',
 *   'channelDetail.channelMembersView.members.title_other': '{{ count }} Mitglieder',
 * };
 *
 * @example
 * const ru: TranslationDictionary = {
 *   'channelDetail.channelMembersView.members.title_one': '{{ count }} участник',
 *   'channelDetail.channelMembersView.members.title_few': '{{ count }} участника',
 *   'channelDetail.channelMembersView.members.title_many': '{{ count }} участников',
 * };
 */
export type TranslationDictionary = Partial<Record<CatalogKey, string>> &
  Partial<Record<`${PluralTranslationKey}_${PluralSuffix}`, string>>;

/**
 * A translation dictionary that also admits keys the SDK does not define, so one `Streami18n`
 * instance can carry an application's own copy alongside the SDK's.
 *
 * `registerTranslation()` and `translationsForLanguage` take the strict
 * {@link TranslationDictionary}; annotate the variable you pass with this type to widen. Nothing
 * catches a mistyped or stale SDK key here — it compiles, and then never matches at runtime. Note
 * that {@link TranslationDictionary} already covers the extra plural categories, so a language
 * needing `_few` / `_many` / `_zero` does not have to give up key checking.
 */
export type LooseTranslationDictionary = Partial<Record<CatalogKey, string>> &
  Record<string, string>;

/** The English copy for a key, used to infer that key's interpolation variables. */
type CopyFor<K extends string> = K extends CatalogKey
  ? TranslationCatalog[K]
  : `${K}_other` extends CatalogKey
    ? TranslationCatalog[`${K}_other` & CatalogKey]
    : string;

/**
 * Keys whose value is a formatter expression or postProcessor directive rather than English copy.
 * They resolve from the bundled `runtimeDefaults`, so call sites pass no inline default. Matched
 * by prefix pattern
 * rather than by enumerating the union, which keeps the overload resolution cheap.
 */
type FormatterKey =
  | `timestamp.${string}`
  | `duration.${string}`
  | `translationBuilderTopic.${string}`;

/** Keys whose value is English copy, passed inline as the `defaultValue`. */
type ProseKey = Exclude<TranslationKey, FormatterKey | PluralTranslationKey>;

/**
 * The SDK's translation function.
 *
 * Every call site passes its English copy inline as i18next's `defaultValue`, so the key stays
 * stable across copy edits and a key missing from a custom dictionary still renders English.
 * Interpolation variables are inferred from that copy, and plural keys require `count`.
 *
 * Deliberately *not* installed via i18next's `CustomTypeOptions`: that augmentation is global and
 * would force an integrator's own unrelated `t()` calls to satisfy the SDK's key union.
 */
export type StreamTFunction = {
  /** Plural key: `count` selects between the `_one` / `_other` copy. */
  <K extends PluralTranslationKey>(
    key: K,
    options: TOptions & { count: number } & InterpolationArgs<CopyFor<K>>,
  ): string;
  /**
   * Formatter/plumbing key: resolves from the bundled `runtimeDefaults`, so no inline default.
   * Options stay loose —
   * the value is a formatter expression, so inferring its variables is neither useful nor cheap
   * (`CopyFor` over a template-literal key pattern blows the union size limit).
   */
  (key: FormatterKey, options?: TOptions & Record<string, unknown>): string;
  /**
   * Prose key with its English copy inline.
   *
   * Neither `defaultValue` nor `options` is tied to the key's exact copy. Doing so means
   * materialising `CopyFor<ProseKey>` — the union of ~540 copy strings — which exceeds
   * TypeScript's union size limit (TS2590). The two checks that would buy are covered elsewhere:
   * the default matching the generated catalog is enforced by the drift gate, and missing
   * interpolation variables surface as a literal `{{ placeholder }}` in the rendered output,
   * which the test suite asserts on.
   *
   * Plural keys keep precise typing (see the first overload) because that union is small.
   */
  <K extends ProseKey>(
    key: K,
    defaultValue: string,
    options?: TOptions & Record<string, unknown>,
  ): string;
  /**
   * Escape hatch for keys only known at runtime — a `notification.message` from `stream-chat`,
   * slash-command metadata from the API, or an integrator-supplied prop. The raw string doubles
   * as the default so it still renders verbatim when no translation exists.
   */
  (
    key: DynamicTranslationKey,
    defaultValueOrOptions?: string | (TOptions & Record<string, unknown>),
    options?: TOptions & Record<string, unknown>,
  ): string;
};

/**
 * A translation key resolved from a runtime value rather than written literally.
 *
 * The brand is *required*, so a plain `string` is not assignable and the escape hatch has to be
 * taken deliberately via `asDynamicKey()` — which also makes every such site greppable.
 *
 * @example t(asDynamicKey(command.description))
 */
export type DynamicTranslationKey = string & {
  readonly __dynamicTranslationKey: true;
};

export type FormatterFactory<V> = (
  streamI18n: Streami18n,
) => (value: V, lng: string | undefined, options: Record<string, unknown>) => string;

export type TimestampFormatterOptions = {
  /* If true, call the `Day.js` calendar function to get the date string to display (e.g. "Yesterday at 3:58 PM"). */
  calendar?: boolean;
  /* Object specifying date display formats for dates formatted with calendar extension. Active only if calendar prop enabled. */
  calendarFormats?: Record<string, string>;
  /* Overrides the default timestamp format if calendar is disabled. */
  format?: string;
  /**
   * Show a short, friendly date instead of a full date and time.
   * - Today shows as "Today"
   * - Yesterday shows as "Yesterday"
   * - A few days ago (2 up to relativeCompactMaxDays) show as "2d ago", "3d ago", etc.
   * - A few weeks ago (if relativeCompactMaxWeeks is greater than 0) show as "1w ago", "2w ago", etc.
   * - Older than that (or future dates) show as a calendar date like 19/02/25
   * You can change the words used (e.g. "Hoy" instead of "Today") by adding or overriding
   * these keys in your locale JSON. Example (paste into your translation JSON):
   *
   *   "relativeTime.today": "Today",
   *   "relativeTime.yesterday": "Yesterday",
   *   "relativeTime.daysAgo": "{{ count }}d ago",
   *   "relativeTime.weeksAgo": "{{ count }}w ago",
   *   "timestamp.PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true) }}"
   *
   * Only days, no weeks (7+ days show as date):
   *   "timestamp.PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactMaxWeeks: 0) }}"
   */
  relativeCompact?: boolean;
  /**
   * How many days in the past still show as "Xd ago" (e.g. 6 means 2d, 3d … 6d ago).
   * After that, it shows weeks (if enabled) or a calendar date.
   */
  relativeCompactMaxDays?: number;
  /**
   * How many weeks in the past show as "Xw ago" (e.g. 3 means 1w, 2w, 3w ago).
   * Set to 0 if you don’t want "Xw ago" at all: anything older than relativeCompactMaxDays
   * will show as a calendar date instead.
   */
  relativeCompactMaxWeeks?: number;
};

/**
 * import dayjs from 'dayjs';
 * import duration from 'dayjs/plugin/duration.js';
 *
 * dayjs.extend(duration);
 *
 * // Basic formatting
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(3661000).format('HH:mm:ss'); // "01:01:01"
 *
 * // Different format tokens
 * dayjs.duration(3661000).format('D[d] H[h] m[m] s[s]'); // "0d 1h 1m 1s"
 * dayjs.duration(3661000).format('D [days] H [hours] m [minutes] s [seconds]'); // "0 days 1 hours 1 minutes 1 seconds"
 *
 * // Zero padding
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(1000).format('H:m:s'); // "0:0:1"
 *
 * // Different units
 * dayjs.duration(3661000).format('D'); // "0"
 * dayjs.duration(3661000).format('H'); // "1"
 * dayjs.duration(3661000).format('m'); // "1"
 * dayjs.duration(3661000).format('s'); // "1"
 *
 * // Complex examples
 * dayjs.duration(3661000).format('DD:HH:mm:ss'); // "00:01:01:01"
 * dayjs.duration(3661000).format('D [days] HH:mm:ss'); // "0 days 01:01:01"
 * dayjs.duration(3661000).format('H[h] m[m] s[s]'); // "1h 1m 1s"
 *
 * // Negative durations
 * dayjs.duration(-3661000).format('HH:mm:ss'); // "-01:01:01"
 *
 * // Long durations
 * dayjs.duration(86400000).format('D [days]'); // "1 days"
 * dayjs.duration(2592000000).format('M [months]'); // "30 months"
 *
 *
 * Format tokens:
 * D - days
 * H - hours
 * m - minutes
 * s - seconds
 * S - milliseconds
 * M - months
 * Y - years
 * You can also use:
 * HH, mm, ss for zero-padded numbers
 * [text] for literal text
 */
export type DurationFormatterOptions = {
  format?: string;
  withSuffix?: boolean;
};

export type TDateTimeParserInput = string | number | Date;
export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;
export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

/**
 * Languages with translations bundled in the SDK. English is the only one; any other
 * language is supplied by the integrator via `Streami18n.registerTranslation()`.
 */
export type SupportedTranslations = 'en';

export type DateFormatterOptions = TimestampFormatterOptions & {
  formatDate?: MessageContextValue['formatDate'];
  messageCreatedAt?: string | Date;
  t?: StreamTFunction;
  tDateTimeParser?: TDateTimeParser;
  timestampTranslationKey?: string;
};

// Here is any used, because we do not want to enforce any specific rules and
// want to leave the type declaration to the integrator
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export type CustomFormatters = Record<string, FormatterFactory<any>>;

export type PredefinedFormatters = {
  durationFormatter: FormatterFactory<number>;
  timestampFormatter: FormatterFactory<string | Date>;
};
