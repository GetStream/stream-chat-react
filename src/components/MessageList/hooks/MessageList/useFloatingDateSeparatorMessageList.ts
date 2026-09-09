import { useCallback, useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

import type { RenderedMessage } from '../../utils';
import { dateToNs } from 'stream-chat';

const DATE_SEPARATOR_SELECTOR =
  '.str-chat__date-separator:not(.str-chat__date-separator--floating)';
const THROTTLE_MS = 100;

export type UseFloatingDateSeparatorMessageListParams = {
  disableDateSeparator: boolean;
  listElement: HTMLDivElement | null;
  processedMessages: RenderedMessage[];
};

export type UseFloatingDateSeparatorMessageListResult = {
  floatingDate: number | null;
  showFloatingDate: boolean;
};

/**
 * For non-virtualized MessageList: keeps the floating date synced with the
 * separator currently pinned to the top boundary of the list viewport.
 */
export const useFloatingDateSeparatorMessageList = ({
  disableDateSeparator,
  listElement,
  processedMessages,
}: UseFloatingDateSeparatorMessageListParams): UseFloatingDateSeparatorMessageListResult => {
  const [state, setState] = useState<{ date: number | null; visible: boolean }>({
    date: null,
    visible: false,
  });

  const update = useCallback(() => {
    if (disableDateSeparator || !listElement || processedMessages.length === 0) {
      setState({ date: null, visible: false });
      return;
    }

    const separators = listElement.querySelectorAll<HTMLElement>(DATE_SEPARATOR_SELECTOR);
    if (separators.length === 0) {
      setState({ date: null, visible: false });
      return;
    }

    const containerRect = listElement.getBoundingClientRect();
    let bestDate: number | null = null;
    let bestTop = -Infinity;

    for (const el of separators) {
      const rect = el.getBoundingClientRect();
      const dataDate = el.getAttribute('data-date');
      if (!dataDate) continue;

      const isAtOrAboveTopBoundary = rect.top <= containerRect.top;

      if (isAtOrAboveTopBoundary && rect.top > bestTop) {
        bestTop = rect.top;
        // `data-date` is the ISO string `DateSeparator` renders, so this is a genuine string
        // boundary rather than a missed conversion — back to a wire timestamp for the consumer.
        const d = new Date(dataDate);
        if (!isNaN(d.getTime())) bestDate = dateToNs(d);
      }
    }

    setState({
      date: bestDate,
      visible: bestDate !== null,
    });
  }, [disableDateSeparator, listElement, processedMessages]);

  useEffect(() => {
    if (!listElement) return;

    const throttled = throttle(update, THROTTLE_MS);

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
