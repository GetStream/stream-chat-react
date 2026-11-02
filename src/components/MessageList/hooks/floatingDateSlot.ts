export const INLINE_DATE_SEPARATOR_SELECTOR =
  '.str-chat__date-separator:not(.str-chat__date-separator--floating)';

/**
 * Inline separators inside the items Virtuoso rendered within the queried scroller. Content outside
 * the items, such as the thread's parent message in the list header, stays mounted while the items
 * around it scroll away.
 */
export const VIRTUALIZED_ITEM_DATE_SEPARATOR_SELECTOR = `:scope [data-item-index] ${INLINE_DATE_SEPARATOR_SELECTOR}`;

/** How often the floating date separator re-measures the list while it scrolls or resizes. */
export const FLOATING_DATE_MEASURE_THROTTLE_MS = 100;

/**
 * The inline separator overlaps the band at the top of the list where the floating separator is
 * drawn. The band is taken to be as tall as the inline separator, as both render `DateSeparator`.
 */
export const overlapsFloatingSlot = (separatorRect: DOMRect, listTop: number) =>
  separatorRect.bottom > listTop && separatorRect.top < listTop + separatorRect.height;
