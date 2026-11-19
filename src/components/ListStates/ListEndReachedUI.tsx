import type { ComponentType } from 'react';

import type { ListEdge } from './ListLoadingNextPageUI';

/** Props of the component a paged list renders at each of its edges. */
export type ListEndReachedUIProps = {
  /** No further page exists at this edge. */
  hasEnded: boolean;
  /** The edge. */
  reached: ListEdge;
};

/**
 * The generic end-reached state of a paged list: nothing at either edge. Search results use their
 * own, which marks the end of the results, while no `ListEndReachedUI` is set.
 */
export const ListEndReachedUI: ComponentType<ListEndReachedUIProps> = () => null;
