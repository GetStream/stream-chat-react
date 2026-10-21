import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { getNextRovingFocusIndex } from '../a11yUtils';

const DEFAULT_OPTION_SELECTOR = '[role="option"]';
// A virtual list's "rendered" callback can fire a frame before the row paints, so focusing after a
// scroll retries across a few animation frames.
const MAX_FOCUS_ATTEMPTS_AFTER_SCROLL = 5;

// Escapes a value for a quoted attribute selector (`[attr="value"]`).
const escapeAttributeValue = (value: string) => value.replace(/(["\\])/g, '\\$1');

export type VirtualizedListboxKeyboardNavigationParams<T> = {
  /** Stable ID of an item; must equal the value its option carries in `itemIdAttribute`. */
  getItemId: (item: T) => string;
  /** Attribute every option carries its ID in, to find the active item and the target option. */
  itemIdAttribute: string;
  /** The full, unvirtualized list, not just the rendered window. */
  items: T[];
  /** Selector for the focusable option elements. Defaults to `[role="option"]`. */
  optionSelector?: string;
  /**
   * Brings the item at `index` into the rendered window and calls `onRendered` once it should be in
   * the DOM. A non-virtualized list can call `onRendered()` directly.
   */
  scrollIndexIntoView: (index: number, onRendered: () => void) => void;
  /** Ref to the scrollable listbox container whose subtree holds the rendered options. */
  scrollerRef: RefObject<HTMLElement | null>;
};

/**
 * Roving-focus navigation (ArrowUp/Down/Home/End) for a virtualized listbox, where only a window of
 * `role="option"` rows is in the DOM. It indexes into the full `items` array, focuses the target
 * row if it is rendered, and otherwise calls `scrollIndexIntoView` and focuses it once painted.
 *
 * Returns `onKeyDown` to spread onto the scroll container, which `scrollerRef` must also point to.
 * The active item is read from the closest element at or above `document.activeElement` that
 * carries `itemIdAttribute`.
 */
export const useVirtualizedListboxKeyboardNavigation = <T>({
  getItemId,
  itemIdAttribute,
  items,
  optionSelector = DEFAULT_OPTION_SELECTOR,
  scrollerRef,
  scrollIndexIntoView,
}: VirtualizedListboxKeyboardNavigationParams<T>) => {
  // Bumped on every roving key press. A deferred post-scroll focus chain bails once a newer press
  // supersedes it, so a slow older scroll cannot steal focus back to an outdated row.
  const latestFocusRequestRef = useRef(0);

  // Focuses the option for `items[index]` if it is in the DOM; returns whether it was.
  const focusOptionAt = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return false;
      const option = scrollerRef.current?.querySelector<HTMLElement>(
        `${optionSelector}[${itemIdAttribute}="${escapeAttributeValue(getItemId(item))}"]`,
      );
      if (!option) return false;
      option.focus();
      return true;
    },
    [getItemId, itemIdAttribute, items, optionSelector, scrollerRef],
  );

  const focusOptionAfterRender = useCallback(
    (
      index: number,
      requestId: number,
      attemptsLeft = MAX_FOCUS_ATTEMPTS_AFTER_SCROLL,
    ) => {
      // A newer key press superseded this chain.
      if (requestId !== latestFocusRequestRef.current) return;
      if (focusOptionAt(index) || attemptsLeft <= 0) return;
      requestAnimationFrame(() =>
        focusOptionAfterRender(index, requestId, attemptsLeft - 1),
      );
    },
    [focusOptionAt],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      const active = document.activeElement;
      const activeId =
        active instanceof HTMLElement
          ? (active
              .closest<HTMLElement>(`[${itemIdAttribute}]`)
              ?.getAttribute(itemIdAttribute) ?? undefined)
          : undefined;
      const activeIndex =
        activeId != null ? items.findIndex((item) => getItemId(item) === activeId) : -1;
      const nextIndex = getNextRovingFocusIndex({
        activeIndex,
        itemCount: items.length,
        key: event.key,
      });
      if (nextIndex === null) return; // Not a roving key.

      event.preventDefault();
      event.stopPropagation();
      // Supersedes any pending off-window focus chain from an earlier key press.
      const requestId = ++latestFocusRequestRef.current;
      // A rendered row is focused right away (native focus scrolls it fully into view); otherwise
      // scroll it into existence and focus it once the list has painted it.
      if (focusOptionAt(nextIndex)) return;
      scrollIndexIntoView(nextIndex, () => focusOptionAfterRender(nextIndex, requestId));
    },
    [
      focusOptionAfterRender,
      focusOptionAt,
      getItemId,
      itemIdAttribute,
      items,
      scrollIndexIntoView,
    ],
  );

  return { onKeyDown };
};
