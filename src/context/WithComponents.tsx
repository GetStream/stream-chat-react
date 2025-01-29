import React, { PropsWithChildren, useContext } from 'react';
import { ComponentContext, ComponentContextValue } from './ComponentContext';

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
