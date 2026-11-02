import { useCallback, useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

import type { RenderedMessage } from '../../utils';
import {
  FLOATING_DATE_MEASURE_THROTTLE_MS,
  INLINE_DATE_SEPARATOR_SELECTOR,
  overlapsFloatingSlot,
} from '../floatingDateSlot';

export type UseFloatingDateSeparatorMessageListParams = {
  listElement: HTMLDivElement | null;
  processedMessages: RenderedMessage[];
  withDateSeparator: boolean;
};

export type UseFloatingDateSeparatorMessageListResult = {
  floatingDate: Date | null;
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
 * Keeps the floating date in sync with the last date separator scrolled out above the top of the
 * list viewport, for the non-virtualized `MessageList`. The floating date is hidden while any inline
 * separator overlaps the spot where it would be drawn, so two date labels never stack.
 */
export const useFloatingDateSeparatorMessageList = ({
  listElement,
  processedMessages,
  withDateSeparator,
}: UseFloatingDateSeparatorMessageListParams): UseFloatingDateSeparatorMessageListResult => {
  const [state, setState] = useState<{ date: Date | null; visible: boolean }>({
    date: null,
    visible: false,
  });

  const update = useCallback(() => {
    if (!withDateSeparator || !listElement || processedMessages.length === 0) {
      setState({ date: null, visible: false });
      return;
    }

    const separators = listElement.querySelectorAll<HTMLElement>(
      INLINE_DATE_SEPARATOR_SELECTOR,
    );
    if (separators.length === 0) {
      setState({ date: null, visible: false });
      return;
    }

    const listTop = listElement.getBoundingClientRect().top;
    let scrolledPastDate: Date | null = null;
    let scrolledPastBottom = -Infinity;
    let isFloatingSlotTaken = false;

    for (const separator of separators) {
      const date = parseSeparatorDate(separator);
      if (!date) continue;

      const separatorRect = separator.getBoundingClientRect();

      if (overlapsFloatingSlot(separatorRect, listTop)) {
        isFloatingSlotTaken = true;
      }

      if (
        isScrolledPastListTop(separatorRect, listTop) &&
        separatorRect.bottom > scrolledPastBottom
      ) {
        scrolledPastBottom = separatorRect.bottom;
        scrolledPastDate = date;
      }
    }

    setState({
      date: scrolledPastDate,
      visible: scrolledPastDate !== null && !isFloatingSlotTaken,
    });
  }, [withDateSeparator, listElement, processedMessages]);

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
    showFloatingDate: state.visible,
  };
};
