import { useCallback } from 'react';

import { usePollContext, useTranslationContext } from '../../../context';
import type { PollTextTranslations } from '../types';
import { getPollTextTranslation } from '../utils/translations';

export const usePollTextTranslation = () => {
  const { userLanguage } = useTranslationContext();
  const { translationView = 'translated' } = usePollContext();

  return useCallback(
    (original: string, i18n: PollTextTranslations | undefined): string =>
      translationView === 'original'
        ? original
        : (getPollTextTranslation(i18n, userLanguage) ?? original),
    [translationView, userLanguage],
  );
};
