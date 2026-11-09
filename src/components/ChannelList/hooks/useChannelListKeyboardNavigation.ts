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
// Roving covers the channel rows and the Load more button, so Down from the last channel lands on
// it. The first-new-item focus logic below counts channel rows only.
const NAVIGABLE_SELECTOR = `${OPTION_SELECTOR}, ${LOAD_MORE_SELECTOR}`;

// How long a pending "focus the first item of the next page" request stays armed after Load more is
// pressed. Expiry keeps an unrelated later list change (e.g. a channel arriving over the WebSocket)
// from triggering a stray focus move.
const LOAD_MORE_FOCUS_TIMEOUT_MS = 4000;

/**
 * Keyboard navigation for the channel list (`role="listbox"`). ArrowUp, ArrowDown, Home and End
 * move focus across the channel rows (`role="option"`) and the Load more button; ArrowLeft and
 * ArrowRight cycle between a row and its action buttons. Activating Load more moves focus to the
 * first item of the newly loaded page once it renders.
 *
 * @param listboxRef - Ref of the listbox element that contains the rows.
 * @returns The `onClickCapture` and `onKeyDown` handlers to spread onto the listbox element.
 */
export const useChannelListKeyboardNavigation = (
  listboxRef: RefObject<HTMLElement | null>,
) => {
  // `enterScope: 'container'` and `resolveActiveOption` keep Up, Down, Home and End working while
  // focus is on a row's action button, moving relative to that row.
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

  // Channel rows only, without the Load more button.
  const getChannelOptions = () =>
    Array.from(listboxRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);

  // Pending "focus the first item of the next page" request. It snapshots the pre-load rows rather
  // than counting them, so a WebSocket-driven insert or reorder is not mistaken for the new page:
  // `boundary` is the last pre-load option (the new page is appended after it) and `preLoad` holds
  // every pre-load option node. Rows are keyed by `cid`, so their DOM nodes stay stable.
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

  // Activating Load more (a click, by mouse or keyboard) arms the focus move.
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

  // Focuses the first item of the newly loaded page once it renders. Runs after every commit and
  // does nothing unless a move is pending. The target must be after the pre-load boundary and
  // absent before the load, so an unrelated row arriving over the WebSocket cannot steal focus.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    const options = getChannelOptions();
    // The list was empty on Load more: the whole list is the new page, so focus its first row.
    if (!pending.boundary) {
      if (options.length > 0) {
        options[0].focus();
        clearPendingFocus();
      }
      return;
    }
    const boundaryIndex = options.indexOf(pending.boundary);
    // The boundary row was removed (e.g. the user left that channel): drop the request rather than
    // guess where the page starts.
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
