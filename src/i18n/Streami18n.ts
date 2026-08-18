import { Streami18n as CoreStreami18n, languageNameDefaults } from 'stream-chat/i18n';
import type { Streami18nOptions as CoreStreami18nOptions } from 'stream-chat/i18n';

import { NotificationTranslationTopic } from './TranslationBuilder';
import { runtimeDefaults } from './runtimeDefaults';
import type { TranslationCatalog } from './types';

/** Keys resolved from bundled data rather than an inline default. Mirrors `types.ts`. */
type BundledKey = `translationBuilderTopic.${string}` | `language.${string}`;

/**
 * Options for {@link Streami18n}.
 *
 * `runtimeDefaults` and `translationBuilderTopics` are both accepted and both *merged* over the SDK's
 * own, so supplying either adds to rather than replaces what the SDK ships.
 */
export type Streami18nOptions = CoreStreami18nOptions<TranslationCatalog>;

/**
 * Wrapper around [i18next](https://www.i18next.com/) for this SDK's translations. Pass an instance to
 * `<Chat i18nInstance={…}>` to control language and copy.
 *
 * The implementation lives in `stream-chat/i18n`, shared with the React Native SDK. What is added here
 * is the two things that are this SDK's own: its bundled translation data, and its notification
 * translation topic. Core cannot import either — the key catalog is generated from *this* package's
 * `t()` call sites.
 *
 * ## Overriding some of the English copy
 *
 * ```ts
 * const i18n = new Streami18n({
 *   translationsForLanguage: {
 *     'emptyState.indicator.noConversationsYet.label': 'Nothing here yet',
 *   },
 * });
 * ```
 *
 * ## Adding a language
 *
 * ```ts
 * import 'dayjs/locale/nl';
 *
 * const i18n = new Streami18n({ language: 'nl' });
 * i18n.registerTranslation('nl', {
 *   'typing.singleUser': '{{ typing }} is aan het typen',
 * });
 * ```
 *
 * Type your dictionary as {@link TranslationDictionary} to turn a typo or a leftover v14 key into a
 * compile error. A partial dictionary is safe: unsupplied keys render the English copy that ships inline
 * with each component, never a raw dotted path.
 *
 * Reactivity goes through `i18n.state`, a `StateStore`. `setLanguage()` returns nothing — the new `t` is
 * published to that store, which `<Chat>` subscribes to.
 */
export class Streami18n extends CoreStreami18n<TranslationCatalog, BundledKey> {
  constructor(options: Streami18nOptions = {}) {
    super({
      ...options,
      // Core owns the `language.*` names, since it owns the `TranslationLanguage` union they describe.
      // Merged under this SDK's own data so an integrator can still override an individual name.
      runtimeDefaults: {
        ...languageNameDefaults,
        ...runtimeDefaults,
        ...options.runtimeDefaults,
      },
      // Merged, not replaced. Spreading `options` over a literal would let an integrator adding one
      // topic silently drop the SDK's own `notification` topic, and notifications would then render
      // untranslated with no error.
      translationBuilderTopics: {
        notification: NotificationTranslationTopic,
        ...options.translationBuilderTopics,
      },
    });
  }
}
