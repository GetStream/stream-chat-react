import { useCallback, useState } from 'react';
import type { ScheduledMessageResponse } from 'stream-chat';

import { matchesScheduledMessageText } from '../utils';

export { matchesScheduledMessageText };

/** Whether a scheduled message matches the search; `searchQuery` is the search field's value. */
export type ScheduledMessageSearchFilter = (
  scheduledMessage: ScheduledMessageResponse,
  searchQuery: string,
) => boolean;

export type UseScheduledMessagesSearchParams = {
  /**
   * Replaces the default text search, for example to search by date. It receives the query, so it
   * can still combine with `matchesScheduledMessageText`. Keep it stable, e.g. with `useCallback`.
   */
  filter?: ScheduledMessageSearchFilter;
};

/**
 * The search field's state, and the `filter` for `ScheduledMessageList` it makes of it. The list
 * loads further pages while none of the loaded messages match, so the matches need not be loaded.
 */
export const useScheduledMessagesSearch = ({
  filter = matchesScheduledMessageText,
}: UseScheduledMessagesSearchParams = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchFilter = useCallback(
    (scheduledMessage: ScheduledMessageResponse) => filter(scheduledMessage, searchQuery),
    [filter, searchQuery],
  );
  return { filter: searchFilter, searchQuery, setSearchQuery };
};
