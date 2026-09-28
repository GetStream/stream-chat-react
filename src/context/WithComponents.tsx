import React, { useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import { ComponentContext } from './ComponentContext';
import type { ComponentContextValue } from './ComponentContext';

export function WithComponents({
  children,
  overrides,
}: PropsWithChildren<{ overrides: Partial<ComponentContextValue> }>) {
  const parentOverrides = useContext(ComponentContext);
  // Memoized because this provider sits on render paths hot enough for the identity of the
  // merged value to matter: a new object on every render re-renders every
  // `useComponentContext()` consumer below it, which would defeat the per-message
  // memoization in `areMessagePropsEqual`.
  const actualOverrides: ComponentContextValue = useMemo(
    () => ({
      ...parentOverrides,
      ...overrides,
      // `icons` merges per slot rather than being replaced wholesale: a nested provider that
      // rebrands one icon must not clear the ones an ancestor supplied.
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
