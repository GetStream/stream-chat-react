export const INLINE_DATE_SEPARATOR_SELECTOR =
  '.str-chat__date-separator:not(.str-chat__date-separator--floating)';

/** How often the floating date separator re-measures the list while it scrolls or resizes. */
export const FLOATING_DATE_MEASURE_THROTTLE_MS = 100;

/**
 * The inline separator overlaps the band at the top of the list where the floating separator is
 * drawn. The band is taken to be as tall as the inline separator, as both render `DateSeparator`.
 */
export const overlapsFloatingSlot = (separatorRect: DOMRect, listTop: number) =>
  separatorRect.bottom > listTop && separatorRect.top < listTop + separatorRect.height;

/** Whether an inline date separator inside `listElement` overlaps the floating separator's spot. */
export const isFloatingSlotTaken = (listElement: HTMLElement) => {
  const listTop = listElement.getBoundingClientRect().top;
  const separators = listElement.querySelectorAll<HTMLElement>(
    INLINE_DATE_SEPARATOR_SELECTOR,
  );
  return Array.from(separators).some((separator) =>
    overlapsFloatingSlot(separator.getBoundingClientRect(), listTop),
  );
};
