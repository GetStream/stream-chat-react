import type { ComponentType } from 'react';
import React, { useMemo } from 'react';

import { useComponentContext } from '../../../context';

/**
 * The Virtuoso `EmptyPlaceholder` of a channel detail view: the `ListEmptyUI` key, or the
 * view's own empty state. Virtuoso renders its empty slot whenever the view has no items, so
 * `showsEmptyState` gates it. The component changes with the empty state and the gate only.
 */
export const useChannelDetailEmptyPlaceholder = (
  ViewEmpty: ComponentType,
  showsEmptyState: boolean,
) => {
  const { ListEmptyUI = ViewEmpty } = useComponentContext();
  return useMemo(
    () =>
      function ChannelDetailEmptyPlaceholder() {
        return showsEmptyState ? <ListEmptyUI /> : null;
      },
    [ListEmptyUI, showsEmptyState],
  );
};
