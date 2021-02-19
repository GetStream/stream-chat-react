import React, { useContext } from 'react';
import Dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';

import { getDisplayName } from './utils/getDisplayName';

import type { TFunction } from 'i18next';
import type { TranslationLanguages } from 'stream-chat';

import type { UnknownType } from '../../types/types';

Dayjs.extend(LocalizedFormat);

export const isDayjs = (output: TDateTimeParserOutput): output is Dayjs.Dayjs =>
  (output as Dayjs.Dayjs).isSame != null;

export const isDate = (output: TDateTimeParserOutput): output is Date =>
  (output as Date).getMonth != null;

export const isNumberOrString = (
  output: TDateTimeParserOutput,
): output is number | string =>
  typeof output === 'string' || typeof output === 'number';

export type TDateTimeParserInput = string | number | Date;

export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs;

export type TDateTimeParser = (
  input?: TDateTimeParserInput,
) => TDateTimeParserOutput;

export type TranslationContextValue = {
  t: TFunction | ((key: string) => string);
  tDateTimeParser: TDateTimeParser;
  userLanguage: TranslationLanguages;
};

export const TranslationContext = React.createContext<TranslationContextValue>({
  t: (key: string) => key,
  tDateTimeParser: (input) => Dayjs(input),
  userLanguage: 'en',
});

export const TranslationProvider: React.FC<{
  value: TranslationContextValue;
}> = ({ children, value }) => (
  <TranslationContext.Provider value={value}>
    {children}
  </TranslationContext.Provider>
);

export const useTranslationContext = () => useContext(TranslationContext);

export const withTranslationContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof TranslationContextValue>> => {
  const WithTranslationContextComponent = (
    props: Omit<P, keyof TranslationContextValue>,
  ) => {
    const translationContext = useTranslationContext();

    return <Component {...(props as P)} {...translationContext} />;
  };

  WithTranslationContextComponent.displayName = `WithTranslationContext${getDisplayName(
    Component,
  )}`;

  return WithTranslationContextComponent;
};
