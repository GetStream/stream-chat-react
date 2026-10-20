import { createTranslationContext } from '@stream-io/i18n/react';

import { defaultDateTimeParser, defaultTranslatorFunction } from '../i18n/utils';
import type { StreamTFunction, TDateTimeParser } from '../i18n/types';

export type TranslationContextValue = {
  t: StreamTFunction;
  tDateTimeParser: TDateTimeParser;
  userLanguage: string;
};

// The default value (instead of throwing) lets primitives render outside `<Chat>`.
const { TranslationContext, TranslationProvider, useTranslationContext } =
  createTranslationContext<TranslationContextValue>({
    defaultValue: {
      t: defaultTranslatorFunction,
      tDateTimeParser: defaultDateTimeParser,
      userLanguage: 'en',
    },
  });

export { TranslationContext, TranslationProvider };

/** Works outside `<Chat>`, where the default translator renders each call site's inline English. */
export { useTranslationContext };
