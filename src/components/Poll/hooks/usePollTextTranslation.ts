import { useCallback } from 'react';
import type { TranslatedField } from 'stream-chat';

import { useMessageContext, useTranslationContext } from '../../../context';
import { getPollTextTranslation } from '../utils/translations';

/**
 * Returns `translate(original, i18n)`, which resolves a poll text (question, option, answer) for
 * the current user language. It follows the enclosing message's translation view, so the message's
 * "View original" toggle switches its poll too. Falls back to `original` when there is no
 * translation for the user language.
 */
export const usePollTextTranslation = () => {
  const { userLanguage } = useTranslationContext('usePollTextTranslation');
  // Outside a message (no MessageProvider) the context is empty, so poll texts are translated.
  const { translationView = 'translated' } = useMessageContext('usePollTextTranslation');

  return useCallback(
    (original: string, i18n: TranslatedField | undefined): string =>
      translationView === 'original'
        ? original
        : (getPollTextTranslation(i18n, userLanguage) ?? original),
    [translationView, userLanguage],
  );
};
