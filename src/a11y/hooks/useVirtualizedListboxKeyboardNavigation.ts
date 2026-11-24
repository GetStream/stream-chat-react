import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { getNextRovingFocusIndex } from '../a11yUtils';

const DEFAULT_OPTION_SELECTOR = '[role="option"]';
// A virtual list's "rendered" callback can fire before the row paints (react-virtuoso 4 reports a
// long scroll done while it still re-measures), so focusing after a scroll retries every animation
// frame for up to this long.
const FOCUS_AFTER_SCROLL_TIMEOUT_MS = 1000;

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
  // The item a pending off-window focus chain is heading to, by ID: the items can change while it
  // is pending (a reload replaces them with a shorter first page), and an index would then point
  // elsewhere, or past the end. A virtual list may report the scroll done only once it settled
  // (react-virtuoso 4 waits for the list to stop changing), so a held arrow key presses again before
  // that row has focus; navigation moves on from this target, not from the row that still has focus.
  const pendingIdRef = useRef<string | null>(null);
  // The item focused when that chain started: focus moved elsewhere since (a click, Tab) makes the
  // pending target stale.
  const pendingFromIdRef = useRef<string | undefined>(undefined);
  // The current items, for a chain that outlives the render it started in.
  // Updated once a render commits: a render React discards (a suspended transition) must not make
  // a pending target that is still on screen look gone.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Focuses the rendered option for the item with this ID; returns whether there was one.
  const focusOptionById = useCallback(
    (id: string) => {
      const option = scrollerRef.current?.querySelector<HTMLElement>(
        `${optionSelector}[${itemIdAttribute}="${escapeAttributeValue(id)}"]`,
      );
      if (!option) return false;
      option.focus();
      return true;
    },
    [itemIdAttribute, optionSelector, scrollerRef],
  );

  // The ID of the item at or above the focused element; undefined when focus is on no item (the
  // scroller itself while a target scrolls in).
  const getActiveItemId = useCallback(() => {
    const active = document.activeElement;
    return active instanceof HTMLElement
      ? (active
          .closest<HTMLElement>(`[${itemIdAttribute}]`)
          ?.getAttribute(itemIdAttribute) ?? undefined)
      : undefined;
  }, [itemIdAttribute]);

  // Whether focus is still where the pending chain left it: on the scroller holding it, on the row
  // the key was pressed on, or nowhere (fallen to <body> as that row unmounted). Focus the reader
  // moved elsewhere (Tab, a click, another row) must not be pulled back when the target renders.
  const isFocusStillPending = useCallback(() => {
    const active = document.activeElement;
    if (!active || active === document.body) return true;
    const scroller = scrollerRef.current;
    if (!scroller?.contains(active)) return false;
    return getActiveItemId() === pendingFromIdRef.current;
  }, [getActiveItemId, scrollerRef]);

  const focusOptionAfterRender = useCallback(
    (
      id: string,
      requestId: number,
      deadline = Date.now() + FOCUS_AFTER_SCROLL_TIMEOUT_MS,
    ) => {
      // A newer key press superseded this chain.
      if (requestId !== latestFocusRequestRef.current) return;
      // Focus moved elsewhere, or the target is gone from the items (they were replaced).
      if (
        !isFocusStillPending() ||
        !itemsRef.current.some((item) => getItemId(item) === id)
      ) {
        pendingIdRef.current = null;
        return;
      }
      if (focusOptionById(id)) {
        pendingIdRef.current = null;
        return;
      }
      // Given up: the pending target stays, so the next press still moves on from it.
      if (Date.now() >= deadline) return;
      requestAnimationFrame(() => focusOptionAfterRender(id, requestId, deadline));
    },
    [focusOptionById, getItemId, isFocusStillPending],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      const active = document.activeElement;
      const scroller = scrollerRef.current;
      const indexOf = (id: string | null | undefined) =>
        id != null ? items.findIndex((item) => getItemId(item) === id) : -1;
      const activeId = getActiveItemId();
      let activeIndex = indexOf(activeId);
      if (pendingIdRef.current !== null && pendingFromIdRef.current === activeId) {
        const pendingIndex = indexOf(pendingIdRef.current);
        if (pendingIndex !== -1) activeIndex = pendingIndex;
        // The pending target is gone from the items: navigation resumes from the list as it is.
        else pendingIdRef.current = null;
      }
      let nextIndex = getNextRovingFocusIndex({
        activeIndex,
        itemCount: items.length,
        key: event.key,
      });
      // Focus on the scroller itself, with no target pending (entering the list, or after a reload
      // replaced the items): an arrow key enters at the first row on screen, not at an end.
      if (
        nextIndex !== null &&
        activeIndex === -1 &&
        scroller &&
        active === scroller &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
      ) {
        const firstRendered = scroller.querySelector<HTMLElement>(
          `${optionSelector}[${itemIdAttribute}]`,
        );
        const entryIndex = indexOf(firstRendered?.getAttribute(itemIdAttribute));
        if (entryIndex !== -1) nextIndex = entryIndex;
      }
      if (nextIndex === null) return; // Not a roving key.
      const nextItem = items[nextIndex];
      if (!nextItem) return;
      const nextId = getItemId(nextItem);

      event.preventDefault();
      event.stopPropagation();
      // Supersedes any pending off-window focus chain from an earlier key press.
      const requestId = ++latestFocusRequestRef.current;
      // A rendered row is focused right away (native focus scrolls it fully into view); otherwise
      // scroll it into existence and focus it once the list has painted it.
      if (focusOptionById(nextId)) {
        pendingIdRef.current = null;
        return;
      }
      // The focused row can leave the rendered window before the target enters it, and focus would
      // then fall to <body>, out of reach of this handler. The scroller holds it meanwhile.
      if (scroller && active instanceof HTMLElement && scroller.contains(active)) {
        if (!scroller.hasAttribute('tabindex')) scroller.tabIndex = -1;
        scroller.focus({ preventScroll: true });
      }
      pendingIdRef.current = nextId;
      pendingFromIdRef.current = getActiveItemId();
      scrollIndexIntoView(nextIndex, () => focusOptionAfterRender(nextId, requestId));
    },
    [
      focusOptionAfterRender,
      focusOptionById,
      getActiveItemId,
      getItemId,
      itemIdAttribute,
      items,
      optionSelector,
      scrollIndexIntoView,
      scrollerRef,
    ],
  );

  return { onKeyDown };
};
