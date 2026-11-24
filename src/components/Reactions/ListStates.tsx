import React from 'react';

import { MessageReactionsDetailLoadingIndicator } from './MessageReactionsDetailLoadingIndicator';
import { useComponentContext } from '../../context';

// The reactions detail's list states: the reacting users' loading state.

/**
 * The reacting users' loading state: the app's `LoadingIndicator` when it sets one, the skeleton
 * otherwise. A `LoadingIndicator` set to `null` turns it off.
 */
export const MessageReactionsDetailFirstPageLoading = () => {
  const { LoadingIndicator = MessageReactionsDetailLoadingIndicator } =
    useComponentContext();
  return LoadingIndicator ? <LoadingIndicator /> : null;
};
