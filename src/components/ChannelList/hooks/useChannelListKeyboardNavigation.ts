import { useEffect, useRef } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
} from 'react';

import { createRovingFocusKeyDownHandler } from '../../../a11y/a11yUtils';

const OPTION_SELECTOR = '[role="option"]';
const ROW_SELECTOR = '.str-chat__channel-list-item-container';
const ACTION_BUTTON_SELECTOR = '.str-chat__channel-list-item__action-buttons button';
const LOAD_MORE_SELECTOR = '[data-testid="load-more-button"]';

// Upper bound for how long a pending "focus the first item of the next page" request stays armed
// after the Load more button is pressed. If the new page hasn't rendered within this window we drop
// the request, so an unrelated later list change (e.g. a channel arriving over the WebSocket) can't
// trigger a stray focus move.
const LOAD_MORE_FOCUS_TIMEOUT_MS = 4000;

/**
 * Keyboard navigation for the channel list (`role="listbox"`). Returns handlers to spread onto the
 * listbox element:
 * - **ArrowUp/ArrowDown/Home/End** move focus between the channel rows (`role="option"`).
 * - **ArrowRight** moves focus from a row to its actions button (the menu is then navigable with
 *   Up/Down via the ContextMenu's own roving focus).
 * - **ArrowLeft** moves focus from a row's actions back to the row.
 * - When **Load more** is activated, focus moves to the **first item of the newly loaded page** once
 *   it renders.
 */
export const useChannelListKeyboardNavigation = (
  listboxRef: RefObject<HTMLElement | null>,
) => {
  // Number of options present when Load more was activated; the option at this index is the first
  // item of the next page once it renders.
  const pendingFocusIndexRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getOptions = () =>
    Array.from(listboxRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);

  const clearPendingFocus = () => {
    pendingFocusIndexRef.current = null;
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !listboxRef.current?.contains(active)) {
      return;
    }

    const onOption = active.matches(OPTION_SELECTOR);

    if (
      onOption &&
      (event.key === 'ArrowUp' ||
        event.key === 'ArrowDown' ||
        event.key === 'Home' ||
        event.key === 'End')
    ) {
      createRovingFocusKeyDownHandler<HTMLElement>({ getItems: getOptions })(event);
      return;
    }

    const row = active.closest(ROW_SELECTOR);
    if (!row) return;

    if (onOption && event.key === 'ArrowRight') {
      const actionButton = row.querySelector<HTMLElement>(ACTION_BUTTON_SELECTOR);
      if (actionButton) {
        event.preventDefault();
        actionButton.focus();
      }
      return;
    }

    if (!onOption && event.key === 'ArrowLeft') {
      const option = row.querySelector<HTMLElement>(OPTION_SELECTOR);
      if (option) {
        event.preventDefault();
        option.focus();
      }
    }
  };

  // Activating Load more (by mouse or keyboard, which both dispatch a click) arms the focus move.
  const onClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(LOAD_MORE_SELECTOR)) return;
    pendingFocusIndexRef.current = getOptions().length;
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(clearPendingFocus, LOAD_MORE_FOCUS_TIMEOUT_MS);
  };

  // After the newly loaded items render (the list grows), focus the first item of the next page.
  // Runs after every commit; cheap no-op unless a focus move is pending.
  useEffect(() => {
    const pending = pendingFocusIndexRef.current;
    if (pending === null) return;
    const options = getOptions();
    if (options.length > pending) {
      options[pending]?.focus();
      clearPendingFocus();
    }
  });

  useEffect(() => () => clearPendingFocus(), []);

  return { onClickCapture, onKeyDown };
};
