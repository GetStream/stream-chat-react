import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type CurrentTrigger<T extends string = string> = '/' | '@' | ':' | T;

export type SuggestionListHeaderProps = {
  currentTrigger: CurrentTrigger;
  value: string;
};

export const DefaultSuggestionListHeader = (props: SuggestionListHeaderProps) => {
  const { currentTrigger, value } = props;

  const { t } = useTranslationContext('DefaultSuggestionListHeader');

  const triggerIndex = value.lastIndexOf(currentTrigger);

  if (currentTrigger === '/') {
    return (
      <>
        {t('Commands matching')} <strong>{value.slice(triggerIndex + 1)}</strong>
      </>
    );
  }

  if (currentTrigger === ':') {
    return (
      <>
        {t('Emoji matching')} <strong>{value.slice(triggerIndex + 1)}</strong>
      </>
    );
  }

  if (currentTrigger === '@') {
    return (
      <>
        {t('People matching')} <strong>{value.slice(triggerIndex + 1)}</strong>
      </>
    );
  }

  return null;
};
