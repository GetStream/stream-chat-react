import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';

import { defaultDateTimeParser, defaultTranslatorFunction } from '../i18n/utils';
import type { StreamTFunction, TDateTimeParser } from '../i18n/types';

/**
 * The `Dayjs.extend(calendar)` / `extend(localizedFormat)` calls that used to sit here are gone.
 *
 * They existed so that the context *default* — used by a component rendered outside `<Chat>` — could
 * still call `.calendar()`. `defaultDateTimeParser` now comes from `stream-chat/i18n` and registers the
 * plugins itself on first use, so the same guarantee holds without a module-scope side effect. That is
 * what lets the package be marked side-effect-free.
 *
 * Worth knowing if this ever regresses: extending dayjs is not optional here, and forgetting it fails
 * *silently* — `.calendar()` is simply absent, so timestamps render malformed rather than throwing.
 */

export type TranslationContextValue = {
  t: StreamTFunction;
  tDateTimeParser: TDateTimeParser;
  userLanguage: string;
};

export const TranslationContext = React.createContext<TranslationContextValue>({
  t: defaultTranslatorFunction,
  tDateTimeParser: defaultDateTimeParser,
  userLanguage: 'en',
});

export const TranslationProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: TranslationContextValue }>) => (
  <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
);

/**
 * Works outside `<Chat>`: the context default's `defaultTranslatorFunction` renders the inline
 * English `defaultValue` every `t()` call site passes, so SDK primitives render standalone.
 */
export const useTranslationContext = () => useContext(TranslationContext);
