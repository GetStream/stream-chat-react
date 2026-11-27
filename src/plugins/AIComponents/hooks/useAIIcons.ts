import { useMemo } from 'react';

import { useComponentContext } from '../../../context/ComponentContext';
import type { IconComponent } from '../../../components/Icons/slots';
import * as DEFAULT_AI_ICONS from '../icons';

/** The icons the AI components draw that the SDK's icon set lacks. */
export type AIIconName = keyof typeof DEFAULT_AI_ICONS;

/**
 * Overrides for the AI components' own icons. Pass them with the SDK's in `WithComponents`'
 * `icons`, which the AI components read too:
 *
 * ```tsx
 * const icons: IconSlots & AIIconSlots = { IconAIShare: MyShareIcon, IconFlag: MyFlagIcon };
 * <WithComponents overrides={{ icons }}>…</WithComponents>
 * ```
 */
export type AIIconSlots = Partial<Record<AIIconName, IconComponent>>;

/**
 * The AI components' own icons, each replaced by the app's override in `ComponentContext`'s
 * `icons` when it has one, as `useComponentContextIcons` does for the SDK's icons.
 */
export const useAIIcons = (): Required<AIIconSlots> => {
  const { icons } = useComponentContext();
  return useMemo(
    () => ({
      ...DEFAULT_AI_ICONS,
      ...(Object.fromEntries(
        Object.entries((icons ?? {}) as Record<string, IconComponent | undefined>).filter(
          ([name, Icon]) => name in DEFAULT_AI_ICONS && !!Icon,
        ),
      ) as AIIconSlots),
    }),
    [icons],
  );
};
