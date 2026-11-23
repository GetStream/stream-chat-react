import type { ComponentType, ReactNode } from 'react';
import React from 'react';

/**
 * Renders a list state through a deprecated, list-specific `ComponentContext` key or through the
 * shared key that replaces it:
 *
 * 1. The deprecated key is `null`: nothing.
 * 2. The deprecated key is set: the deprecated component, while `showsDeprecated` holds.
 * 3. Otherwise: `replacement`, the shared key's element.
 *
 * @param Deprecated The deprecated key's value from `useComponentContext()`.
 * @param deprecatedProps The props the deprecated component receives.
 * @param replacement The element of the shared key that replaces it.
 * @param showsDeprecated Whether the deprecated component is shown now, for a key that is shown
 *   only in some states (e.g. only while a page loads). Defaults to `true`.
 */
export const renderWithDeprecatedKey = <P extends object>(
  Deprecated: ComponentType<P> | null | undefined,
  deprecatedProps: P,
  replacement: ReactNode,
  showsDeprecated = true,
): ReactNode => {
  if (Deprecated === null) return null;
  if (Deprecated) return showsDeprecated ? <Deprecated {...deprecatedProps} /> : null;
  return replacement;
};
