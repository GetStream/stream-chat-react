import type {
  Streami18nState as CoreStreami18nState,
  LooseTranslationDictionaryOf,
  RelativeTimeCatalog,
  StreamTFunctionFor,
  TranslationDictionaryOf,
  TranslationKeyOf,
} from '@stream-io/i18n';
// Names of the languages the API can auto-translate a message into: Chat API metadata, so it
// lives in `stream-chat`.
import type { LanguageNameCatalog } from 'stream-chat';

import type { TranslationCatalog as GeneratedCatalog } from './keys';

/**
 * The SDK's translation catalog: the keys generated from its `t()` call sites, plus the language
 * names from `stream-chat` (which make `t('language.de')` a checked key rather than an
 * `asDynamicKey()` escape) and the relative-time keys from `@stream-io/i18n`.
 */
export type TranslationCatalog = GeneratedCatalog &
  LanguageNameCatalog &
  RelativeTimeCatalog;

/**
 * Keys resolved from bundled data rather than an inline `defaultValue`, beyond the `timestamp.*`
 * and `duration.*` prefixes core already matches: post-processor directives, and language names,
 * which are looked up by a runtime language code and so have no call site to carry a default.
 * `Streami18n` and `StreamTFunction` both use this one declaration so their `t` types agree.
 */
export type BundledKey = `translationBuilderTopic.${string}` | `language.${string}`;

export type TranslationKey = TranslationKeyOf<TranslationCatalog>;
export type TranslationDictionary = TranslationDictionaryOf<TranslationCatalog>;
export type LooseTranslationDictionary = LooseTranslationDictionaryOf<TranslationCatalog>;
export type StreamTFunction = StreamTFunctionFor<TranslationCatalog, BundledKey>;

/**
 * The value held by `Streami18n.state`, parameterized for this SDK's catalog. Use it, not core's
 * default-parameterized `Streami18nState`, to type a selector: `t` is contravariant in its options,
 * so core's type is not assignable to this one.
 */
export type Streami18nState = CoreStreami18nState<TranslationCatalog, BundledKey>;

export type {
  CustomFormatters,
  DateTimeParserModule,
  DayjsLocaleConfig,
  DurationFormatterOptions,
  DynamicTranslationKey,
  FormatterFactory,
  PredefinedFormatters,
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from '@stream-io/i18n';
