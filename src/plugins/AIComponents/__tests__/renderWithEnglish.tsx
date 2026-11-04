import React, { type ReactElement } from 'react';
import { render } from '@testing-library/react';

import { TranslationProvider } from '../../../context';
import en from '../../../i18n/en.json';

// English with i18next-style interpolation, so tests read the strings people see.
export const englishT = ((key: string, options?: Record<string, unknown>) =>
  ((en as Record<string, string>)[key] ?? key).replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, name: string) => String(options?.[name] ?? ''),
  )) as never;

export const EnglishProvider = ({ children }: { children: ReactElement }) => (
  <TranslationProvider
    value={{ t: englishT, tDateTimeParser: (() => null) as never, userLanguage: 'en' }}
  >
    {children}
  </TranslationProvider>
);

export const renderWithEnglish = (ui: ReactElement) =>
  render(ui, { wrapper: EnglishProvider });
