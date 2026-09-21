import type { ComponentType } from 'react';

import type { BaseIconProps } from './BaseIcon';
import type * as icons from './icons';

/**
 * The contract an icon override must satisfy. `BaseIconProps` rather than plain SVG props, so an
 * override still accepts `decorative` and can opt out of `aria-hidden` the same way an SDK icon
 * does.
 */
export type IconComponent = ComponentType<BaseIconProps>;

/**
 * Every icon the SDK ships, derived from the icon module rather than hand-listed. A new icon in
 * `icons.tsx` becomes overridable the moment it is exported, and a removed one stops type-checking
 * at its call sites — neither can drift out of sync with this type.
 */
export type IconName = keyof typeof icons;

/**
 * Icon overrides supplied through `ComponentContext.icons`. Deep-merged with sibling entries by
 * `WithComponents`, so a consumer can rebrand a single icon without clearing the others.
 */
export type IconSlots = Partial<Record<IconName, IconComponent>>;
