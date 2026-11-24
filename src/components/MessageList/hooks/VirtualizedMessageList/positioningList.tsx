import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useLayoutEffect,
} from 'react';
import type { ComponentType } from 'react';
import type { Components, ListProps } from 'react-virtuoso';

/** Receives whether Virtuoso keeps the item list hidden while it positions it. */
export const ListPositioningReporterContext = createContext<
  ((hidden: boolean) => void) | undefined
>(undefined);

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type ListComponent<Context> = NonNullable<Components<unknown, Context>['List']>;

/**
 * The test ID Virtuoso passes to the list of items pinned at the top (`topItemCount`), which it
 * renders with the same `components.List`. It is positioned with the main list and is not reported.
 */
const TOP_ITEM_LIST_TEST_ID = 'virtuoso-top-item-list';

/**
 * Wraps the item list (Virtuoso's own `div`, or an integrator's `components.List`) to report the
 * `visibility: hidden` react-virtuoso 4 sets in the list's `style` until it reaches
 * `initialTopMostItemIndex`. Read from the props Virtuoso passes, so a custom list that renders
 * other markup (no test ID, its own style) is still told apart while it is positioned.
 */
export const makePositioningReportingList = <Context,>(
  CustomList?: ListComponent<Context>,
) => {
  const List = forwardRef<HTMLDivElement, ListProps & { context?: Context }>(
    function PositioningReportingList({ context, ...props }, ref) {
      const reportFromContext = useContext(ListPositioningReporterContext);
      // Read from the prop Virtuoso passes, not from what the list renders.
      const report =
        props['data-testid'] === TOP_ITEM_LIST_TEST_ID ? undefined : reportFromContext;
      const hidden = props.style?.visibility === 'hidden';
      useIsomorphicLayoutEffect(() => {
        report?.(hidden);
      }, [hidden, report]);
      useIsomorphicLayoutEffect(() => () => report?.(false), [report]);
      if (CustomList) {
        const Custom = CustomList as ComponentType<ListProps & { context?: Context }>;
        return <Custom {...props} context={context} ref={ref} />;
      }
      return <div {...props} ref={ref} />;
    },
  );
  return List as unknown as ListComponent<Context>;
};
