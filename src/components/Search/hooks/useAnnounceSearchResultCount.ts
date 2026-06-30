import { useRef } from 'react';
import type { RefObject } from 'react';
import type { SearchSource } from 'stream-chat';

import { useInteractionAnnouncements } from '../../Accessibility';
import { useMutationObserver } from '../../UtilityComponents/hooks/useMutationObserver';

const OPTION_SELECTOR = '[role="option"]';

/**
 * Announces how many items are listed in the search results — and, when the list is fully loaded,
 * folds the "all results loaded" end-of-list status into that SAME announcement.
 *
 * The count is taken from the rendered options (`[role="option"]`) in `containerRef`, observed with
 * {@link useMutationObserver} — so it is source-agnostic (works across channels/messages/users and
 * any custom result component) and reflects exactly what the user sees. Delivery goes through the
 * shared {@link useInteractionAnnouncements} registry (`search.resultCount`), which debounces the
 * value so it lands once results settle (after the screen reader's typing echo) instead of on every
 * change.
 *
 * `allResultsLoaded` is derived (when the announcement fires) from the active sources' latest state:
 * true only when every active source has no next page and is not loading. Carrying it in the count
 * message — rather than as a separate live-region announcement — keeps the end-of-list status from
 * competing with (and superseding) the count.
 *
 * The observer fires on every subtree mutation, but the announcement is made only when the
 * `count`/`allResultsLoaded` SIGNATURE changes — so an in-place action (e.g. muting a channel in a
 * result, which re-renders the row without changing the count) does not re-announce. It also bails
 * while inactive: gated on `active` (an in-progress search with a query) so it never fires during
 * presearch, and the pending (debounced) count is cancelled — and the signature reset — when search
 * is exited, so a stale count is not spoken after the results are gone.
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

      // Announce only when the meaningful state changes, not on every re-render of a result row.
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
