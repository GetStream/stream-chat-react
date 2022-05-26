import React, { PropsWithChildren, useContext } from 'react';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { getDisplayName } from './utils/getDisplayName';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment';
import type { TranslationLanguages } from 'stream-chat';

import type { UnknownType } from '../types/types';
import { defaultTranslatorFunction } from '../i18n';

Dayjs.extend(calendar);
Dayjs.extend(localizedFormat);

export type SupportedTranslations =
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'hi'
  | 'it'
  | 'ja'
  | 'ko'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'tr';

export const isLanguageSupported = (language: string): language is SupportedTranslations => {
  const translations = ['de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr'];
  return translations.some((translation) => language === translation);
};

export const isDayOrMoment = (output: TDateTimeParserOutput): output is Dayjs.Dayjs | Moment =>
  !!(output as Dayjs.Dayjs | Moment)?.isSame;

export const isDate = (output: TDateTimeParserOutput): output is Date =>
  !!(output as Date)?.getMonth;

export const isNumberOrString = (output: TDateTimeParserOutput): output is number | string =>
  typeof output === 'string' || typeof output === 'number';

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;

export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

export type TranslationContextValue = {
  t: TFunction;
  tDateTimeParser: TDateTimeParser;
  userLanguage: TranslationLanguages;
};

export const defaultDateTimeParser = (input?: TDateTimeParserInput) => Dayjs(input);

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

export const useTranslationContext = (componentName?: string) => {
  const contextValue = useContext(TranslationContext);

  if (!contextValue) {
    console.warn(
      `The useTranslationContext hook was called outside of the TranslationContext provider. Make sure this hook is called within a child of the Chat component. The errored call is located in the ${componentName} component.`,
    );

    return {} as TranslationContextValue;
  }

  return contextValue;
};

export const withTranslationContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
) => {
  const WithTranslationContextComponent = (props: Omit<P, keyof TranslationContextValue>) => {
    const translationContext = useTranslationContext();

    return <Component {...(props as P)} {...translationContext} />;
  };

  WithTranslationContextComponent.displayName = `WithTranslationContext${getDisplayName(
    Component,
  )}`;

  return WithTranslationContextComponent;
};
