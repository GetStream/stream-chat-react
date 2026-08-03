import { useMemo } from 'react';

import { useComponentContext } from './ComponentContext';
import * as DEFAULT_ICONS from '../components/Icons/icons';
import type { IconSlots } from '../components/Icons/slots';

/**
 * Reads the `icons` override from `ComponentContext` and merges it on top of
 * `DEFAULT_ICONS`. Every returned icon is guaranteed defined, so callers can
 * destructure without fallbacks:
 *
 * ```tsx
 * const { IconFlag } = useComponentContextIcons();
 * ```
 *
 * Overrides supplied via `<WithComponents overrides={{ icons: { … } }} />` win
 * over defaults on a per-slot basis; slots the consumer didn't provide fall
 * back to the SDK's own icon.
 */
export const useComponentContextIcons = (): Required<IconSlots> => {
  const { icons } = useComponentContext();

  return useMemo(() => {
    const definedOverrides = Object.fromEntries(
      Object.entries(icons ?? {}).filter(([, Icon]) => typeof Icon === 'function'),
    );

    return { ...DEFAULT_ICONS, ...definedOverrides };

    // Component should be stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
