import type { TranslationContextValue } from '../../../context/TranslationContext';
import type { TypingEntry } from '../hooks/useDebouncedTypingActive';

/**
 * Build a localized typing-status message for screen-reader and inline indicator text.
 */
export const getTypingStatusMessage = (
  displayUsers: readonly TypingEntry[],
  t: TranslationContextValue['t'],
) => {
  const namedUsers = displayUsers
    .map(({ user }) => user?.name?.trim() || user?.id || '')
    .filter(Boolean);
  const count = displayUsers.length;

  if (count === 1 && namedUsers.length === 1) {
    return t('typing.singleUser', '{{ typing }} is typing', { typing: namedUsers[0] });
  }

  if (count === 2 && namedUsers.length === 2) {
    return t('typing.twoUsers', '{{ typing }} are typing', {
      typing: `${namedUsers[0]} and ${namedUsers[1]}`,
    });
  }

  return t('typing.manyUsers', {
    count,
    defaultValue_one: '{{ count }} person is typing',
    defaultValue_other: '{{ count }} people are typing',
  });
};
