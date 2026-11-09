import { useRef } from 'react';
import type { RefObject } from 'react';
import type { SearchSource } from 'stream-chat';

import { useInteractionAnnouncements } from '../../Accessibility';
import { useMutationObserver } from '../../UtilityComponents/hooks/useMutationObserver';

const OPTION_SELECTOR = '[role="option"]';

/**
 * Announces how many `[role="option"]` elements are listed in `containerRef`, whatever the result
 * source. Once every active source is fully loaded, the "all results loaded" status joins the same
 * announcement so that it cannot supersede the count.
 *
 * The announcement goes through the debounced `search.resultCount` interaction and is made only
 * when the count or the loaded status changes, so an in-place update of a result row is not
 * repeated. Becoming inactive cancels a pending announcement.
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
      const allResultsLoaded =
        activeSources.length > 0 &&
        activeSources.every((source) => {
          const { hasNext, isLoading } = source.state.getLatestValue();
          return !hasNext && !isLoading;
        });

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
