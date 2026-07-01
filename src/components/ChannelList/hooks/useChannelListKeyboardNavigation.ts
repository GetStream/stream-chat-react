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

  // Number of channel rows present when Load more was activated; the row at this index is the first
  // item of the next page once it renders.
  const pendingFocusIndexRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingFocus = () => {
    pendingFocusIndexRef.current = null;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  };

  // Activating Load more (by mouse or keyboard, which both dispatch a click) arms the focus move.
  const onClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(LOAD_MORE_SELECTOR)) return;
    pendingFocusIndexRef.current = getChannelOptions().length;
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(clearPendingFocus, LOAD_MORE_FOCUS_TIMEOUT_MS);
  };

  // After the newly loaded items render (the list grows), focus the first item of the next page.
  // Runs after every commit; cheap no-op unless a focus move is pending.
  useEffect(() => {
    const pending = pendingFocusIndexRef.current;
    if (pending === null) return;
    const options = getChannelOptions();
    if (options.length > pending) {
      options[pending]?.focus();
      clearPendingFocus();
    }
  });

  useEffect(() => () => clearPendingFocus(), []);

  return { onClickCapture, onKeyDown };
};
