import type { PropsWithChildren } from 'react';
import React, { useContext } from 'react';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

import { defaultDateTimeParser, defaultTranslatorFunction } from '../i18n/utils';
import type { StreamTFunction, TDateTimeParser } from '../i18n/types';

Dayjs.extend(calendar);
Dayjs.extend(localizedFormat);

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
 * `TranslationContext` carries a real default (see the `createContext` call above), so this hook
 * keeps working outside `<Chat>`: `defaultTranslatorFunction` renders the inline English
 * `defaultValue` that every `t()` call site passes. That is what lets an SDK primitive render
 * standalone, so this hook deliberately does not throw.
 */
export const useTranslationContext = () => useContext(TranslationContext);
