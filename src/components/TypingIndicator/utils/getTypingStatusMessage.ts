import type { TypingEntry } from '../hooks/useDebouncedTypingActive';

type TranslationFunction = (
  key: string,
  options?: Record<string, number | string>,
) => string;

/**
 * Build a localized typing-status message for screen-reader and inline indicator text.
 */
export const getTypingStatusMessage = (
  displayUsers: readonly TypingEntry[],
  t: TranslationFunction,
) => {
  const namedUsers = displayUsers
    .map(({ user }) => user?.name?.trim() || user?.id || '')
    .filter(Boolean);
  const count = displayUsers.length;

  if (count === 1 && namedUsers.length === 1) {
    return t('{{ typing }} is typing', { typing: namedUsers[0] });
  }

  if (count === 2 && namedUsers.length === 2) {
    return t('{{ typing }} are typing', {
      typing: `${namedUsers[0]} and ${namedUsers[1]}`,
    });
  }

  return t('{{ count }} people are typing', { count });
};
