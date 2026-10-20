import React, { useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import { ComponentContext } from './ComponentContext';
import type { ComponentContextValue } from './ComponentContext';

export function WithComponents({
  children,
  overrides,
}: PropsWithChildren<{ overrides: Partial<ComponentContextValue> }>) {
  const parentOverrides = useContext(ComponentContext);
  // Memoized: a new value on every render re-renders every `useComponentContext()` consumer below,
  // which defeats the per-message memoization in `areMessagePropsEqual`.
  const actualOverrides: ComponentContextValue = useMemo(
    () => ({
      ...parentOverrides,
      ...overrides,
      // Merged per slot so a nested provider overriding one icon keeps the ancestor's others.
      icons: { ...parentOverrides?.icons, ...overrides?.icons },
    }),
    [parentOverrides, overrides],
  );
  return (
    <ComponentContext.Provider value={actualOverrides}>
      {children}
    </ComponentContext.Provider>
  );
}
