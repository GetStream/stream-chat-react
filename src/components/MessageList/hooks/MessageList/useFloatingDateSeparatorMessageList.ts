import { useCallback, useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

import type { RenderedMessage } from '../../utils';

const DATE_SEPARATOR_SELECTOR =
  '.str-chat__date-separator:not(.str-chat__date-separator--floating)';
const THROTTLE_MS = 100;

export type UseFloatingDateSeparatorMessageListParams = {
  disableDateSeparator: boolean;
  listElement: HTMLDivElement | null;
  processedMessages: RenderedMessage[];
};

export type UseFloatingDateSeparatorMessageListResult = {
  floatingDate: Date | null;
  showFloatingDate: boolean;
};

/**
 * For non-virtualized MessageList: uses scroll + DOM query to find which date
 * separator we've scrolled past. Shows floating date when none are visible.
 */
export const useFloatingDateSeparatorMessageList = ({
  disableDateSeparator,
  listElement,
  processedMessages,
}: UseFloatingDateSeparatorMessageListParams): UseFloatingDateSeparatorMessageListResult => {
  const [state, setState] = useState<{ date: Date | null; visible: boolean }>({
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
    let bestDate: Date | null = null;
    let bestBottom = -Infinity;
    let anyVisible = false;

    for (const el of separators) {
      const rect = el.getBoundingClientRect();
      const dataDate = el.getAttribute('data-date');
      if (!dataDate) continue;

      const isAboveViewport = rect.bottom < containerRect.top;
      const isVisible =
        rect.top < containerRect.bottom && rect.bottom > containerRect.top;

      if (isVisible) {
        anyVisible = true;
      }

      if (isAboveViewport && rect.bottom > bestBottom) {
        bestBottom = rect.bottom;
        const d = new Date(dataDate);
        if (!isNaN(d.getTime())) bestDate = d;
      }
    }

    setState({
      date: anyVisible ? null : bestDate,
      visible: !anyVisible && bestDate !== null,
    });
  }, [disableDateSeparator, listElement, processedMessages]);

  useEffect(() => {
    if (!listElement) return;

    const throttled = throttle(update, THROTTLE_MS);

    throttled();
    listElement.addEventListener('scroll', throttled);
    const resizeObserver = new ResizeObserver(throttled);
    resizeObserver.observe(listElement);

    return () => {
      listElement.removeEventListener('scroll', throttled);
      resizeObserver.disconnect();
      throttled.cancel();
    };
  }, [listElement, update]);

  return {
    floatingDate: state.date,
    showFloatingDate: state.visible,
  };
};
