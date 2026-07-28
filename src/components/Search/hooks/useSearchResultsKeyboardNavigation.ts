import type { RefObject } from 'react';

import {
  createRowActionKeyHandlers,
  useListboxKeyboardNavigation,
} from '../../../a11y/hooks/useListboxKeyboardNavigation';

// Channel/message results render a `ChannelListItem` (same markup as the channel list), so they
// carry a row container and action buttons. User results do not, so the horizontal keys no-op there.
const OPTION_SELECTOR = '[role="option"]';
const ROW_SELECTOR = '.str-chat__channel-list-item-container';
const ACTION_BUTTON_SELECTOR = '.str-chat__channel-list-item__action-buttons button';

/**
 * Keyboard navigation for the search results list (see {@link useListboxKeyboardNavigation}):
 * - **ArrowUp/ArrowDown/Home/End** rove the result options — from anywhere in the container, so the
 *   user can enter the list from the preceding filter tags (`enterScope: 'container'`) and so they
 *   keep working while focus is on a result's action button (moving relative to that result).
 * - **ArrowRight/ArrowLeft** move between a channel/message result and its actions button and back;
 *   user results have no actions, so the horizontal keys do nothing for them.
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
