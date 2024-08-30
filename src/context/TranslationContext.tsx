import React, { PropsWithChildren, useContext } from 'react';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { getDisplayName } from './utils/getDisplayName';
import { defaultDateTimeParser, defaultTranslatorFunction } from '../i18n/utils';

import type { TFunction } from 'i18next';
import type { TranslationLanguages } from 'stream-chat';

import type { UnknownType } from '../types/types';
import type { TDateTimeParser } from '../i18n/types';

Dayjs.extend(calendar);
Dayjs.extend(localizedFormat);

export type TranslationContextValue = {
  t: TFunction;
  tDateTimeParser: TDateTimeParser;
  userLanguage: TranslationLanguages;
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
