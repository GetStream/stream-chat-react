import React from 'react';

import {
  ChannelDetailListLoadingNextPageUI,
  type ChannelDetailListLoadingNextPageUIProps,
} from './ListStates';

// The deprecated name renders its new one, read when it renders, so import order cannot leave it
// undefined.

/**
 * @deprecated Use `ChannelDetailListLoadingNextPageUI`, which it renders. Removed in the next
 * major.
 */
export const ChannelDetailListLoadingIndicator = <T,>(
  props: ChannelDetailListLoadingNextPageUIProps<T>,
) => <ChannelDetailListLoadingNextPageUI {...props} />;

/**
 * @deprecated Use `ChannelDetailListLoadingNextPageUIProps`, the same type. Removed in the next
 * major.
 */
export type ChannelMembersViewListFooterProps<T> =
  ChannelDetailListLoadingNextPageUIProps<T>;
