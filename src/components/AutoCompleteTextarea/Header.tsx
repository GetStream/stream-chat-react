import React from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

export type SuggestionListHeaderProps = {
  value: string;
};

export const DefaultSuggestionListHeader: React.FC<SuggestionListHeaderProps> = ({ value }) => {
  const { t } = useTranslationContext();

  if (value[0] === '/') {
    return (
      <>
        {t('Commands matching')} <strong>{value.replace('/', '')}</strong>
      </>
    );
  }
  if (value[0] === ':') {
    return (
      <>
        {t('Emoji matching')} <strong>{value.replace(':', '')}</strong>
      </>
    );
  }
  if (value[0] === '@') {
    return (
      <>
        {t('People matching')} <strong>{value.replace('@', '')}</strong>
      </>
    );
  }
  return null;
};
