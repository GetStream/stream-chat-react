/**
 * The `TranslationBuilder` / `TranslationTopic` / `Translator` plumbing now lives in
 * `@stream-io/i18n`, shared with the React Native SDK. Only the *topics* are this SDK's own, since
 * they reference its key names.
 */
export {
  TranslationBuilder,
  TranslationTopic,
  type TranslationTopicConstructor,
  type TranslationTopicOptions,
  type Translator,
} from '@stream-io/i18n';
export * from './notifications';
