import type { ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { useStateStore } from '../../../store';

export type ChannelPaginatorView = {
  /** The channels currently loaded by pagination, in server order. */
  channels: ChannelPaginatorState['items'];
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  lastQueryError?: Error;
};

const selector = (state: ChannelPaginatorState): ChannelPaginatorView => ({
  channels: state.items,
  hasNext: state.hasMoreTail,
  hasPrev: state.hasMoreHead,
  isLoading: state.isLoading,
  lastQueryError: state.lastQueryError,
});

/**
 * Reactive view of a `ChannelPaginator`'s paginated state — the channels plus query status. This
 * is the single supported read path for the paginated list, so consumers never touch the raw
 * store shape (which lets the SDK evolve its internal storage, e.g. id-based, without breaking
 * callers). Retained items are a separate concern — see `useRetainedChannels`.
 */
export const useChannelPaginatorState = (paginator: ChannelPaginator) =>
  useStateStore(paginator.state, selector);
