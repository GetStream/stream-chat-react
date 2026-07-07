import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';

import {
  createRowActionKeyHandlers,
  useListboxKeyboardNavigation,
} from '../../../a11y/hooks/useListboxKeyboardNavigation';

const OPTION_SELECTOR = '[role="option"]';
const ROW_SELECTOR = '.str-chat__channel-list-item-container';
const ACTION_BUTTON_SELECTOR = '.str-chat__channel-list-item__action-buttons button';
const LOAD_MORE_SELECTOR = '[data-testid="load-more-button"]';
// Roving covers the channel rows AND the Load more button, so Down from the last channel lands on
// it (and Up/End/Home behave). The load-more "focus the first new item" logic below still counts
// channel rows only, so the button being a roving target does not skew the page-boundary index.
const NAVIGABLE_SELECTOR = `${OPTION_SELECTOR}, ${LOAD_MORE_SELECTOR}`;

// Upper bound for how long a pending "focus the first item of the next page" request stays armed
// after the Load more button is pressed. If the new page hasn't rendered within this window we drop
// the request, so an unrelated later list change (e.g. a channel arriving over the WebSocket) can't
// trigger a stray focus move.
const LOAD_MORE_FOCUS_TIMEOUT_MS = 4000;

/**
 * Keyboard navigation for the channel list (`role="listbox"`). Returns handlers to spread onto the
 * listbox element:
 * - **ArrowUp/ArrowDown/Home/End** move focus between the channel rows (`role="option"`) and the
 *   **Load more** button (the last roving target when present).
 * - **ArrowRight** moves focus from a row to its actions button (the menu is then navigable with
 *   Up/Down via the ContextMenu's own roving focus).
 * - **ArrowLeft** moves focus from a row's actions back to the row.
 * - When **Load more** is activated, focus moves to the **first item of the newly loaded page** once
 *   it renders.
 */
export const useChannelListKeyboardNavigation = (
  listboxRef: RefObject<HTMLElement | null>,
) => {
  // Shared roving (channels + Load more) + ArrowRight→actions / ArrowLeft→row. `enterScope:
  // 'container'` + `resolveActiveOption` make Up/Down/Home/End work even while focus is on a row's
  // action button — moving to the next/previous channel relative to that row.
  const { onKeyDown } = useListboxKeyboardNavigation(listboxRef, {
    enterScope: 'container',
    keyHandlers: createRowActionKeyHandlers({
      actionSelector: ACTION_BUTTON_SELECTOR,
      rowSelector: ROW_SELECTOR,
    }),
    optionSelector: NAVIGABLE_SELECTOR,
    resolveActiveOption: (active) =>
      active.closest(ROW_SELECTOR)?.querySelector<HTMLElement>(OPTION_SELECTOR) ?? null,
  });

  // Channel rows only (excludes the Load more button) — used to find the first item of the next page.
  const getChannelOptions = () =>
    Array.from(listboxRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);

  // A pending "focus the first item of the next page" request. Rather than keying off the raw row
  // COUNT (which a WebSocket-driven insert/reorder during the load window could satisfy with an
  // unrelated row), we snapshot the pre-load rows: `boundary` is the last pre-load option (the new
  // page is appended after it) and `preLoad` is the set of all pre-load option nodes (so a genuinely
  // new row can be told apart from a reordered existing one). Rows are keyed by cid, so React keeps
  // their DOM nodes stable across re-renders, making these references reliable identities.
  const pendingFocusRef = useRef<{
    boundary: HTMLElement | null;
    preLoad: Set<HTMLElement>;
  } | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingFocus = () => {
    pendingFocusRef.current = null;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  };

  // Activating Load more (by mouse or keyboard, which both dispatch a click) arms the focus move.
  const onClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(LOAD_MORE_SELECTOR)) return;
    const options = getChannelOptions();
    pendingFocusRef.current = {
      boundary: options[options.length - 1] ?? null,
      preLoad: new Set(options),
    };
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(clearPendingFocus, LOAD_MORE_FOCUS_TIMEOUT_MS);
  };

  // After the newly loaded page renders, focus its first item. Runs after every commit; cheap no-op
  // unless a focus move is pending. We look for the first option that is BOTH after the pre-load
  // boundary AND was not present before load — so an unrelated row arriving over the WebSocket (which
  // sorts above the boundary, and/or is not "after" it) does not trigger a stray focus move.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const options = getChannelOptions();
    // Empty list when Load more was pressed: the whole list is the new page — focus its first row.
    if (!pending.boundary) {
      if (options.length > 0) {
        options[0].focus();
        clearPendingFocus();
      }
      return;
    }
    const boundaryIndex = options.indexOf(pending.boundary);
    // Boundary row was removed (e.g. the user left that channel) — drop the request rather than
    // guessing where the page starts.
    if (boundaryIndex === -1) {
      clearPendingFocus();
      return;
    }
    const firstNewOption = options
      .slice(boundaryIndex + 1)
      .find((option) => !pending.preLoad.has(option));
    // Nothing new after the boundary yet: keep waiting (within the timeout) for the page to render.
    if (!firstNewOption) return;
    firstNewOption.focus();
    clearPendingFocus();
  });

  useEffect(() => () => clearPendingFocus(), []);

  return { onClickCapture, onKeyDown };
};
