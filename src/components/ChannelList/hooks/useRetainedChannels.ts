import { useMemo } from 'react';
import type { Channel, ChannelPaginator } from 'stream-chat';

import { useStateStore } from '../../../store';

const selector = (state: { itemIds: string[] }) => ({ itemIds: state.itemIds });

/**
 * Reactive list of a paginator's **retained** channels — channels surfaced outside pagination
 * (a deep-link restore, a search result, a new DM) via `retainItem` / `orchestrator.retainChannel`.
 * They are held in the paginator's separate `retainedState` store (ids only) and resolved here to
 * entities via the shared `ItemIndex`, ordered by the paginator's own sort (`effectiveComparator`,
 * so boost still applies). Consumers render this wherever they like — e.g. a pinned section above
 * the channel list — independently of the paginated list.
 */
export const useRetainedChannels = (paginator: ChannelPaginator): Channel[] => {
  const { itemIds } = useStateStore(paginator.retainedState, selector);

  return useMemo(() => {
    const channels = itemIds
      .map((id) => paginator.getItem(id))
      .filter((channel): channel is Channel => !!channel);
    return channels.sort(paginator.effectiveComparator);
  }, [itemIds, paginator]);
};
