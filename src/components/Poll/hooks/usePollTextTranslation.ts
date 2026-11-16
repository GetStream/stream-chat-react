import { useCallback } from 'react';
import type { TranslatedField } from 'stream-chat';

import { usePollContext, useTranslationContext } from '../../../context';
import { getPollTextTranslation } from '../utils/translations';

export const usePollTextTranslation = () => {
  const { userLanguage } = useTranslationContext('usePollTextTranslation');
  const { translationView = 'translated' } = usePollContext();

  return useCallback(
    (original: string, i18n: TranslatedField | undefined): string =>
      translationView === 'original'
        ? original
        : (getPollTextTranslation(i18n, userLanguage) ?? original),
    [translationView, userLanguage],
  );
};
