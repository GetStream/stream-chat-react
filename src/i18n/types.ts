import type {
  Streami18nState as CoreStreami18nState,
  LanguageNameCatalog,
  LooseTranslationDictionaryOf,
  PluralTranslationKeyOf,
  RelativeTimeCatalog,
  StreamTFunctionFor,
  TDateTimeParser,
  TimestampFormatterOptions,
  TranslationDictionaryOf,
  TranslationKeyOf,
} from 'stream-chat/i18n';

import type { TranslationCatalog as GeneratedCatalog } from './keys';

/**
 * The SDK's i18n types, instantiated from the generic helpers in `stream-chat/i18n`.
 *
 * The derivations live in core so both UI SDKs share one implementation; the *catalog* stays here,
 * because it is generated from this SDK's own `t()` call sites. That split is why core's helpers are
 * generic over the catalog rather than driven by module augmentation — two catalogs have to be able to
 * coexist in one TypeScript program.
 *
 * `language.*` keys come from core: `message.i18n.language` is typed `TranslationLanguage`, so core
 * defines which languages exist and owns their display names. Intersecting them in is what makes
 * `t('language.de')` a checked key instead of an `asDynamicKey()` escape.
 */
export type TranslationCatalog = GeneratedCatalog &
  LanguageNameCatalog &
  RelativeTimeCatalog;

/**
 * Keys resolved from bundled data rather than an inline `defaultValue`.
 *
 * `timestamp.*` and `duration.*` are matched by prefix inside core. This adds the two prefixes specific
 * to this SDK: the post-processor directives, and the language names, which are looked up by a runtime
 * language code and so have no call site to carry a default.
 *
 * Exported so `Streami18n.ts` can parameterize the class from the same declaration `StreamTFunction`
 * uses. It was declared twice; a third prefix added to one copy would have made the exported `t` type
 * and the class instance's own `t` disagree about the same call.
 */
export type BundledKey = `translationBuilderTopic.${string}` | `language.${string}`;

export type PluralTranslationKey = PluralTranslationKeyOf<TranslationCatalog>;
export type TranslationKey = TranslationKeyOf<TranslationCatalog>;
export type TranslationDictionary = TranslationDictionaryOf<TranslationCatalog>;
export type LooseTranslationDictionary = LooseTranslationDictionaryOf<TranslationCatalog>;
export type StreamTFunction = StreamTFunctionFor<TranslationCatalog, BundledKey>;

/**
 * The value held by `Streami18n.state`, parameterized for this SDK's catalog.
 *
 * Exported because `state` is public: a consumer subscribing to it needs to be able to name the
 * type for a module-scope selector. The default-parameterized `Streami18nState` from core is not a
 * substitute -- `t` is contravariant in its options, so that one is not assignable to this.
 */
export type Streami18nState = CoreStreami18nState<TranslationCatalog, BundledKey>;

/**
 * Options for `getDateString`.
 *
 * Declared here rather than taken from core because `formatDate` is a component prop: core's own
 * `GetDateStringParams` types it structurally as `(date: Date) => string`, which is the same shape, but
 * keeping the alias local means the prop and this option cannot drift apart.
 */
export type DateFormatterOptions = TimestampFormatterOptions & {
  formatDate?: (date: Date) => string;
  messageCreatedAt?: string | Date;
  t?: StreamTFunction;
  tDateTimeParser?: TDateTimeParser;
  timestampTranslationKey?: string;
};

export type {
  AnyTranslationCatalog,
  CustomFormatters,
  DayjsLocaleConfig,
  DurationFormatterOptions,
  DynamicTranslationKey,
  FormatterFactory,
  LanguageNameCatalog,
  PredefinedFormatters,
  RelativeTimeCatalog,
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from 'stream-chat/i18n';
