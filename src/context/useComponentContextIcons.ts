import { useMemo } from 'react';

import { useComponentContext } from './ComponentContext';
import * as DEFAULT_ICONS from '../components/Icons/icons';
import type { IconSlots } from '../components/Icons/slots';

/**
 * Merges the `icons` override from `ComponentContext` over the SDK's own icons, per slot. Every
 * slot is defined, so callers destructure without fallbacks:
 *
 * ```tsx
 * const { IconFlag } = useComponentContextIcons();
 * ```
 */
export const useComponentContextIcons = (): Required<IconSlots> => {
  const { icons } = useComponentContext();

  // Keyed on `icons` (kept stable by `WithComponents`) so an override swapped at runtime is picked
  // up. Empty entries are filtered so a slot set to `undefined` keeps the SDK icon.
  return useMemo(
    () => ({
      ...DEFAULT_ICONS,
      ...Object.fromEntries(Object.entries(icons ?? {}).filter(([, Icon]) => !!Icon)),
    }),
    [icons],
  );
};
