import { useCallback, useContext } from 'react';
import type { PollResponseData } from 'stream-chat';

import { MessageContext, useTranslationContext } from '../../../context';
import { getPollTextTranslation } from '../utils/translations';

/**
 * Returns `translate(original, i18n)`, which resolves a poll text (question, option, answer) for
 * the current user language. It follows the enclosing message's translation view, so the message's
 * "View original" toggle switches its poll too. Falls back to `original` when there is no
 * translation for the user language.
 */
export const usePollTextTranslation = () => {
  const { userLanguage } = useTranslationContext();
  // Read without `useMessageContext()`, which throws: the poll parts using this hook (header,
  // results, option list, answers) did not require a MessageContext before, and must not start to.
  const { translationView = 'translated' } = useContext(MessageContext) ?? {};

  return useCallback(
    (original: string, i18n: PollResponseData['name_i18n']): string =>
      translationView === 'original'
        ? original
        : (getPollTextTranslation(i18n, userLanguage) ?? original),
    [translationView, userLanguage],
  );
};
