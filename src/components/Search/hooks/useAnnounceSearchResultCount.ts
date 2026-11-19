import { useRef } from 'react';
import type { RefObject } from 'react';
import type { SearchSource } from 'stream-chat';

import { useInteractionAnnouncements } from '../../Accessibility';
import { getErrorShownInPlaceOfList } from '../../ListStates/utils';
import { useMutationObserver } from '../../UtilityComponents/hooks/useMutationObserver';

const OPTION_SELECTOR = '[role="option"]';

/** The source shows the error of its failed first page in place of its results. */
const showsFirstPageLoadError = (source: SearchSource) => {
  const { isLoading, items, lastQueryError } = source.state.getLatestValue();
  return !!getErrorShownInPlaceOfList({
    hasItemsToShow: !!items?.length,
    isLoading,
    lastQueryError,
  });
};

/** The source has loaded every result: none is left to load and its first page did not fail. */
const hasLoadedAllResults = (source: SearchSource) => {
  const { hasNext, isLoading } = source.state.getLatestValue();
  return !hasNext && !isLoading && !showsFirstPageLoadError(source);
};

/**
 * Announces how many `[role="option"]` elements are listed in `containerRef`, whatever the result
 * source. Once every active source is fully loaded, the "all results loaded" status joins the same
 * announcement so that it cannot supersede the count.
 *
 * The announcement goes through the debounced `search.resultCount` interaction and is made only
 * when the count or the loaded status changes, so an in-place update of a result row is not
 * repeated. No results are not announced while a source shows that its first page failed: the
 * search did not find nothing. Becoming inactive cancels a pending announcement.
 *
 * @param containerRef - Element that contains the result options.
 * @param active - Whether to observe and announce, e.g. only while a search query is present.
 * @param activeSources - Sources whose pagination state decides whether all results are loaded.
 */
export const useAnnounceSearchResultCount = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  activeSources: SearchSource[] = [],
) => {
  const { announceInteraction, cancelInteraction } = useInteractionAnnouncements();
  const lastSignatureRef = useRef<string | null>(null);

  useMutationObserver(
    containerRef,
    () => {
      if (!active) return;
      const count = containerRef.current?.querySelectorAll(OPTION_SELECTOR).length ?? 0;
      if (count === 0 && activeSources.some(showsFirstPageLoadError)) {
        // The search did not find nothing: drop a count scheduled while the query ran, and let the
        // next settled state announce.
        lastSignatureRef.current = null;
        cancelInteraction('search.resultCount');
        return;
      }
      const allResultsLoaded =
        activeSources.length > 0 && activeSources.every(hasLoadedAllResults);

      // Skip mutations that change neither value, such as a result row re-rendering in place.
      const signature = `${count}|${allResultsLoaded}`;
      if (signature === lastSignatureRef.current) return;
      lastSignatureRef.current = signature;

      announceInteraction('search.resultCount', { allResultsLoaded, count });
    },
    {
      enabled: active,
      onDisconnect: () => {
        lastSignatureRef.current = null;
        cancelInteraction('search.resultCount');
      },
    },
  );
};
