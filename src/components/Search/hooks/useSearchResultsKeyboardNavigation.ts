import type { RefObject } from 'react';

import {
  createRowActionKeyHandlers,
  useListboxKeyboardNavigation,
} from '../../../a11y/hooks/useListboxKeyboardNavigation';

// Channel and message results render a `ChannelListItem`, so they have a row container and action
// buttons. User results do not, so the horizontal keys do nothing there.
const OPTION_SELECTOR = '[role="option"]';
const ROW_SELECTOR = '.str-chat__channel-list-item-container';
const ACTION_BUTTON_SELECTOR = '.str-chat__channel-list-item__action-buttons button';

/**
 * Keyboard navigation for the search results. ArrowUp, ArrowDown, Home and End rove the result
 * options from anywhere in the container, so they also work from the filter buttons before the
 * options and from a result's action button. ArrowRight and ArrowLeft move between a result and its
 * action button.
 *
 * @param containerRef - Container of the result options.
 * @returns An object with the `onKeyDown` handler to attach to the container.
 */
export const useSearchResultsKeyboardNavigation = (
  containerRef: RefObject<HTMLElement | null>,
) => {
  const { onKeyDown } = useListboxKeyboardNavigation(containerRef, {
    enterScope: 'container',
    keyHandlers: createRowActionKeyHandlers({
      actionSelector: ACTION_BUTTON_SELECTOR,
      rowSelector: ROW_SELECTOR,
    }),
    resolveActiveOption: (active) =>
      active.closest(ROW_SELECTOR)?.querySelector<HTMLElement>(OPTION_SELECTOR) ?? null,
  });

  return { onKeyDown };
};
