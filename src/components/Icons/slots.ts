import type { ComponentType } from 'react';

import type { BaseIconProps } from './BaseIcon';
import type * as icons from './icons';

/** Contract for an icon override. Takes `BaseIconProps`, so `decorative` works as on SDK icons. */
export type IconComponent = ComponentType<BaseIconProps>;

/** Name of every icon exported from `icons.tsx`; derived from the module, so it cannot drift. */
export type IconName = keyof typeof icons;

/** Icon overrides supplied via `ComponentContext.icons`; `WithComponents` merges them per slot. */
export type IconSlots = Partial<Record<IconName, IconComponent>>;
