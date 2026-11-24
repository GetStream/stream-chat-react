import React from 'react';

import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';
import { useComponentContext } from '../../context/ComponentContext';

/** An edge of a paged list. In the message lists, older messages load at the top. */
export type ListEdge = 'top' | 'bottom';

/** Props of the component a paged list renders at the edge where further pages load. */
export type ListLoadingNextPageUIProps = {
  /** A page is loading at this edge. */
  isLoading?: boolean;
  /** The edge where the page loads. The SDK's lists always pass it. */
  position?: ListEdge;
};

/**
 * The generic next-page loading state of a paged list: the `LoadingIndicator` while `isLoading`,
 * nothing otherwise. A `LoadingIndicator` set to `null` turns it off.
 */
export const ListLoadingNextPageUI = ({ isLoading }: ListLoadingNextPageUIProps) => {
  // The default applies only to an unset key, so `null` stays `null` and hides the spinner.
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();

  if (!isLoading || !LoadingIndicator) return null;
  return <LoadingIndicator />;
};
