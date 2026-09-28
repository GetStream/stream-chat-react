import { createTranslationContext } from '@stream-io/i18n/react';

import { defaultDateTimeParser, defaultTranslatorFunction } from '../i18n/utils';
import type { StreamTFunction, TDateTimeParser } from '../i18n/types';

/**
 * The `Dayjs.extend(calendar)` / `extend(localizedFormat)` calls that used to sit here are gone:
 * `defaultDateTimeParser` from `@stream-io/i18n` registers the plugins itself on first use, which
 * is what lets the package stay side-effect-free.
 *
 * If that ever regresses it fails *silently* — `.calendar()` is simply absent, so timestamps render
 * malformed rather than throwing.
 */

export type TranslationContextValue = {
  t: StreamTFunction;
  tDateTimeParser: TDateTimeParser;
  userLanguage: string;
};

/**
 * Built from the shared factory in `@stream-io/i18n/react`. What stays this SDK's own: the
 * catalog-typed `t`, and supplying a **default** rather than throwing, so primitives render outside
 * `<Chat>` (React Native throws instead — hence the option).
 */
const { TranslationContext, TranslationProvider, useTranslationContext } =
  createTranslationContext<TranslationContextValue>({
    defaultValue: {
      t: defaultTranslatorFunction,
      tDateTimeParser: defaultDateTimeParser,
      userLanguage: 'en',
    },
  });

export { TranslationContext, TranslationProvider };

/** Works outside `<Chat>` — the default translator renders each call site's inline English. */
export { useTranslationContext };
