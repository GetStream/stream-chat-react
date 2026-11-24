import type { ComponentType } from 'react';
import type { ContextProp } from 'react-virtuoso';

/**
 * Types a component that ignores Virtuoso's `context` as a Virtuoso slot (`EmptyPlaceholder`,
 * `Footer`, …). Since react-virtuoso 4, every slot is typed as receiving `context`; Virtuoso does
 * pass it, and a component that does not read it ignores the extra prop, so only the type changes.
 */
export const asVirtuosoSlot = <Context = unknown>(
  Component: ComponentType | undefined,
): ComponentType<ContextProp<Context>> | undefined =>
  Component as ComponentType<ContextProp<Context>> | undefined;
