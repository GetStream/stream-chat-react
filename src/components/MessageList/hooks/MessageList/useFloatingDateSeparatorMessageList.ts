import { useCallback, useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

import type { RenderedMessage } from '../../utils';
import {
  FLOATING_DATE_MEASURE_THROTTLE_MS,
  INLINE_DATE_SEPARATOR_SELECTOR,
  overlapsFloatingSlot,
} from '../floatingDateSlot';

type MeasuredState = { date: Date | null; isFloatingSlotTaken: boolean };

const EMPTY_STATE: MeasuredState = { date: null, isFloatingSlotTaken: false };

/** Two measurements agree on the date and on the floating spot, so the state can stay as it is. */
const isSameMeasurement = (a: MeasuredState, b: MeasuredState) =>
  a.isFloatingSlotTaken === b.isFloatingSlotTaken &&
  (a.date?.getTime() ?? null) === (b.date?.getTime() ?? null);

export type UseFloatingDateSeparatorMessageListParams = {
  /** Scroll container holding the rendered inline date separators. */
  listElement: HTMLElement | null;
  processedMessages: RenderedMessage[];
  withDateSeparator: boolean;
  /**
   * Which inline separators may supply the floating date, queried on `listElement` (`:scope` refers
   * to it). Every inline separator still counts toward the floating spot being taken. Defaults to
   * all of them.
   */
  datedSeparatorSelector?: string;
};

export type UseFloatingDateSeparatorMessageListResult = {
  /** Date of the last rendered inline separator scrolled out above the list's top edge. */
  floatingDate: Date | null;
  /** Whether a rendered inline separator overlaps the spot where the floating one is drawn. */
  isFloatingSlotTaken: boolean;
  showFloatingDate: boolean;
};

/** The inline separator lies entirely above the list's top edge, so its label is out of view. */
const isScrolledPastListTop = (separatorRect: DOMRect, listTop: number) =>
  separatorRect.bottom <= listTop;

const parseSeparatorDate = (separator: HTMLElement) => {
  const dataDate = separator.getAttribute('data-date');
  if (!dataDate) return null;
  const date = new Date(dataDate);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * The date of the last separator matching `datedSeparatorSelector` that scrolled out above the
 * list's top edge, and whether any inline separator overlaps the floating spot.
 */
const measureInlineSeparators = (
  listElement: HTMLElement,
  datedSeparatorSelector: string,
): MeasuredState => {
  const listTop = listElement.getBoundingClientRect().top;
  let scrolledPastDate: Date | null = null;
  let scrolledPastBottom = -Infinity;
  let isFloatingSlotTaken = false;
  const datedSeparators = new Set(listElement.querySelectorAll(datedSeparatorSelector));

  for (const separator of listElement.querySelectorAll<HTMLElement>(
    INLINE_DATE_SEPARATOR_SELECTOR,
  )) {
    const separatorRect = separator.getBoundingClientRect();

    if (overlapsFloatingSlot(separatorRect, listTop)) {
      isFloatingSlotTaken = true;
    }

    const date = datedSeparators.has(separator) ? parseSeparatorDate(separator) : null;
    if (
      date &&
      isScrolledPastListTop(separatorRect, listTop) &&
      separatorRect.bottom > scrolledPastBottom
    ) {
      scrolledPastBottom = separatorRect.bottom;
      scrolledPastDate = date;
    }
  }

  return { date: scrolledPastDate, isFloatingSlotTaken };
};

/**
 * Measures the inline date separators rendered in a scroll container: the date of the last one
 * scrolled out above its top edge, and whether one overlaps the spot where the floating separator
 * is drawn. The floating date is shown only when there is a date and that spot is free, so two date
 * labels never stack. `MessageList` passes its list; `VirtualizedMessageList` passes its scroller,
 * where only the items Virtuoso rendered can be measured. It re-measures on scroll and resize only.
 */
export const useFloatingDateSeparatorMessageList = ({
  datedSeparatorSelector = INLINE_DATE_SEPARATOR_SELECTOR,
  listElement,
  processedMessages,
  withDateSeparator,
}: UseFloatingDateSeparatorMessageListParams): UseFloatingDateSeparatorMessageListResult => {
  const [state, setState] = useState<MeasuredState>(EMPTY_STATE);
  const hasMessages = processedMessages.length > 0;

  const update = useCallback(() => {
    const next =
      withDateSeparator && listElement && hasMessages
        ? measureInlineSeparators(listElement, datedSeparatorSelector)
        : EMPTY_STATE;
    setState((prev) => (isSameMeasurement(prev, next) ? prev : next));
  }, [datedSeparatorSelector, hasMessages, listElement, withDateSeparator]);

  useEffect(() => {
    if (!listElement) return;

    const throttled = throttle(update, FLOATING_DATE_MEASURE_THROTTLE_MS);

    throttled();
    listElement.addEventListener('scroll', throttled);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(throttled) : undefined;
    resizeObserver?.observe(listElement);

    return () => {
      listElement.removeEventListener('scroll', throttled);
      resizeObserver?.disconnect();
      throttled.cancel();
    };
  }, [listElement, update]);

  return {
    floatingDate: state.date,
    isFloatingSlotTaken: state.isFloatingSlotTaken,
    showFloatingDate: state.date !== null && !state.isFloatingSlotTaken,
  };
};
