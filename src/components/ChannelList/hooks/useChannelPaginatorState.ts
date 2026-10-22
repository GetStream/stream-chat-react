import type { ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { useStateStore } from '../../../store';

export type ChannelPaginatorView = {
  /** The channels currently loaded by pagination, in server order. */
  channels: ChannelPaginatorState['items'];
  /** More channels exist before the first loaded one, loaded with `paginator.toHead()`. */
  hasMoreHead: boolean;
  /** More channels exist after the last loaded one, loaded with `paginator.toTail()`. */
  hasMoreTail: boolean;
  isLoading: boolean;
  lastQueryError?: Error;
};

const selector = (state: ChannelPaginatorState): ChannelPaginatorView => ({
  channels: state.items,
  hasMoreHead: state.hasMoreHead,
  hasMoreTail: state.hasMoreTail,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

/**
 * Reactive view of a `ChannelPaginator`'s paginated state: the channels plus query status. Reading
 * through it keeps callers independent of the raw store shape. Items ingested out of pagination
 * order are not included; subscribe to the paginator's `intervalViews` store (`logicalHead`,
 * `logicalTail`) for those.
 *
 * @param paginator - Paginator to subscribe to.
 * @returns The {@link ChannelPaginatorView}.
 */
export const useChannelPaginatorState = (paginator: ChannelPaginator) =>
  useStateStore(paginator.state, selector);
