import React, { useContext } from 'react';
import type { PropsWithChildren } from 'react';

import { ComponentContext } from './ComponentContext';
import type { ComponentContextValue } from './ComponentContext';

export function WithComponents({
  children,
  overrides,
}: PropsWithChildren<{ overrides: Partial<ComponentContextValue> }>) {
  const parentOverrides = useContext(ComponentContext);
  const actualOverrides: ComponentContextValue = { ...parentOverrides, ...overrides };
  return (
    <ComponentContext.Provider value={actualOverrides}>
      {children}
    </ComponentContext.Provider>
  );
}
