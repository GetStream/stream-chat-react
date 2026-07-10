import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { useCallback, useRef } from 'react';

import { getNextRovingFocusIndex } from '../a11yUtils';

const DEFAULT_OPTION_SELECTOR = '[role="option"]';
// After scrolling an off-window row into view, the row may not be in the DOM on the very next tick
// (a virtual list's "rendered" callback can fire a frame before the row paints). Retry focusing it
// across a few animation frames before giving up.
const MAX_FOCUS_ATTEMPTS_AFTER_SCROLL = 5;

// Escape a value for use inside a quoted attribute selector (`[attr="value"]`).
const escapeAttributeValue = (value: string) => value.replace(/(["\\])/g, '\\$1');

export type VirtualizedListboxKeyboardNavigationParams<T> = {
  /** Stable id for an item; must equal the value the item's option carries in `itemIdAttribute`. */
  getItemId: (item: T) => string;
  /**
   * The attribute every option carries its id in (e.g. `'data-thread-id'`). Used both to read the id
   * off the focused element and to locate the target option in the DOM.
   */
  itemIdAttribute: string;
  /** The full, unvirtualized list — NOT just the rendered window. Roving indexes into this. */
  items: T[];
  /** Selector for the focusable option elements. Default `[role="option"]`. */
  optionSelector?: string;
  /**
   * Bring the item at `index` into the rendered window, then invoke `onRendered` once it should be in
   * the DOM. For a virtualized list wrap the list's imperative scroll (e.g. Virtuoso's
   * `scrollIntoView({ index, done: onRendered })`); for a non-virtualized list just call
   * `onRendered()`.
   */
  scrollIndexIntoView: (index: number, onRendered: () => void) => void;
  /** Ref to the scrollable listbox container whose subtree holds the rendered options. */
  scrollerRef: RefObject<HTMLElement | null>;
};

/**
 * Vertical roving-focus keyboard navigation (ArrowUp/Down/Home/End) for a **virtualized** listbox,
 * where only a window of `role="option"` rows exists in the DOM at a time.
 *
 * A DOM-query-and-`.focus()` approach (see {@link useListboxKeyboardNavigation}) can't work here: it
 * would only ever see the rendered window, so it would cycle within those rows and never scroll the
 * rest of the list into view. This hook instead indexes into the **full** `items` array, focuses the
 * target row if it is already rendered, and otherwise asks the list to scroll it into existence
 * (`scrollIndexIntoView`) and focuses it once painted (retrying across a few frames).
 *
 * Returns an `onKeyDown` to spread onto the scroll container (the `role="listbox"` element). The
 * caller wires `scrollerRef` to that same element and provides `scrollIndexIntoView`. Stateless — the
 * active row is read live from `document.activeElement` on each key.
 */
export const useVirtualizedListboxKeyboardNavigation = <T>({
  getItemId,
  itemIdAttribute,
  items,
  optionSelector = DEFAULT_OPTION_SELECTOR,
  scrollerRef,
  scrollIndexIntoView,
}: VirtualizedListboxKeyboardNavigationParams<T>) => {
  // Each roving key press bumps this. A deferred (post-scroll) focus chain captures the id at
  // schedule time and bails once it is superseded, so a slower older scroll can't steal focus back
  // to an outdated row after the user has pressed another key.
  const latestFocusRequestRef = useRef(0);

  // Focus the option for `items[index]` if it is currently in the DOM. Returns whether it was found.
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
      // A newer key press superseded this chain — stop so it can't steal focus back.
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
      if (nextIndex === null) return; // not a roving key — leave it alone

      event.preventDefault();
      event.stopPropagation();
      // Supersede any still-pending off-window focus chain from a previous key press.
      const requestId = ++latestFocusRequestRef.current;
      // Within the rendered window: focus right away (no scroll lag; native focus brings it fully
      // into view if it sat in the overscan). Otherwise scroll the row into existence, then focus it
      // once the list has painted it.
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
