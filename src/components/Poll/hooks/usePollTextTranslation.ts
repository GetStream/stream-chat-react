import { useCallback } from 'react';
import type { TranslatedField } from 'stream-chat';

import { usePollContext, useTranslationContext } from '../../../context';
import { getPollTextTranslation } from '../utils/translations';

/**
 * Returns `translate(original, i18n)`, which resolves a poll text (question, option, answer) for
 * the current user language. It follows the poll's translation view (`PollContext`), which the
 * message UI sets from the message's, so the message's "View original" toggle switches its poll
 * too. Falls back to `original` when there is no translation for the user language, and translates
 * when no translation view is set.
 */
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
