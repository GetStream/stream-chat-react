import type { RefObject } from 'react';

import { useInteractionAnnouncements } from '../../Accessibility';
import { useMutationObserver } from '../../UtilityComponents/hooks/useMutationObserver';

const OPTION_SELECTOR = '[role="option"]';

/**
 * Announces how many items are listed in the search results.
 *
 * The count is taken from the rendered options (`[role="option"]`) in `containerRef`, observed with
 * {@link useMutationObserver} — so it is source-agnostic (works across channels/messages/users and
 * any custom result component) and reflects exactly what the user sees. Delivery goes through the
 * shared {@link useInteractionAnnouncements} registry (`search.resultCount`), which debounces the
 * value so it lands once results settle (after the screen reader's typing echo) instead of on every
 * change.
 *
 * Gated on `active` (an in-progress search with a query) so it does not fire during the presearch
 * state; the pending (debounced) count is cancelled when search is exited so it is not spoken after
 * the results are gone.
 */
export const useAnnounceSearchResultCount = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) => {
  const { announceInteraction, cancelInteraction } = useInteractionAnnouncements();

  useMutationObserver(
    containerRef,
    () =>
      announceInteraction('search.resultCount', {
        count: containerRef.current?.querySelectorAll(OPTION_SELECTOR).length ?? 0,
      }),
    {
      enabled: active,
      onDisconnect: () => cancelInteraction('search.resultCount'),
    },
  );
};
