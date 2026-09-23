import { useMemo } from 'react';

import { useComponentContext } from './ComponentContext';
import * as DEFAULT_ICONS from '../components/Icons/icons';
import type { IconSlots } from '../components/Icons/slots';

/**
 * Reads the `icons` override from `ComponentContext` and merges it over the SDK's own icons. Every
 * slot is guaranteed defined, so callers destructure without fallbacks:
 *
 * ```tsx
 * const { IconFlag } = useComponentContextIcons();
 * ```
 *
 * Overrides supplied via `<WithComponents overrides={{ icons: { … } }} />` win per slot; slots the
 * consumer did not provide fall back to the SDK icon.
 */
export const useComponentContextIcons = (): Required<IconSlots> => {
  const { icons } = useComponentContext();

  // Keyed on `icons`, not on `[]`: `WithComponents` already memoizes the merged context value, so
  // this identity is stable across renders and an override swapped at runtime is still picked up.
  // Entries are filtered because a slot explicitly set to `undefined` must fall back to the SDK
  // icon rather than spread a hole over it.
  return useMemo(
    () => ({
      ...DEFAULT_ICONS,
      ...Object.fromEntries(Object.entries(icons ?? {}).filter(([, Icon]) => !!Icon)),
    }),
    [icons],
  );
};
