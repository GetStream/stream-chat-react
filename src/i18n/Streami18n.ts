import { Streami18n as CoreStreami18n } from '@stream-io/i18n';
import type { Streami18nOptions as CoreStreami18nOptions } from '@stream-io/i18n';
import { languageNameDefaults } from 'stream-chat';

import { NotificationTranslationTopic } from './TranslationBuilder';
import { runtimeDefaults } from './runtimeDefaults';
import type { BundledKey, TranslationCatalog } from './types';

/**
 * Options for {@link Streami18n}. `runtimeDefaults` and `translationBuilderTopics` are merged over
 * the SDK's own, so supplying either adds to what the SDK ships.
 */
export type Streami18nOptions = CoreStreami18nOptions<TranslationCatalog>;

/**
 * Wrapper around [i18next](https://www.i18next.com/) for this SDK's translations. Pass an instance to
 * `<Chat i18nInstance={...}>` to control language and copy.
 *
 * Adds this SDK's bundled data and notification translation topic to the `@stream-io/i18n`
 * implementation. A partial dictionary is safe: missing keys render the English copy passed inline
 * at each call site. Type a dictionary as {@link TranslationDictionary} so unknown keys fail to
 * compile. `setLanguage()` publishes the new `t` to `i18n.state`, which `<Chat>` subscribes to.
 *
 * Override some English copy:
 *
 * ```ts
 * const i18n = new Streami18n({
 *   translationsForLanguage: {
 *     'emptyState.indicator.noConversationsYet.label': 'Nothing here yet',
 *   },
 * });
 * ```
 *
 * Add a language:
 *
 * ```ts
 * import 'dayjs/locale/nl';
 *
 * const i18n = new Streami18n({ language: 'nl' });
 * i18n.registerTranslation('nl', { 'typing.singleUser': '{{ typing }} is aan het typen' });
 * ```
 */
export class Streami18n extends CoreStreami18n<TranslationCatalog, BundledKey> {
  constructor(options: Streami18nOptions = {}) {
    super({
      ...options,
      // The `language.*` names from `stream-chat` go first, so this SDK's data and the integrator's
      // can override an individual name.
      runtimeDefaults: {
        ...languageNameDefaults,
        ...runtimeDefaults,
        ...options.runtimeDefaults,
      },
      // Merged so an integrator adding a topic does not drop the `notification` topic, which would
      // leave notifications untranslated without an error.
      translationBuilderTopics: {
        notification: NotificationTranslationTopic,
        ...options.translationBuilderTopics,
      },
    });
  }
}
