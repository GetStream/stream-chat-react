import { useCallback, useState } from 'react';

import type { RenderedMessage } from '../../utils';
import { isDateSeparatorMessage, isIntroMessage } from '../../utils';
import type { LocalMessage } from 'stream-chat';
import { nsToDate } from 'stream-chat';

export type UseFloatingDateSeparatorParams = {
  processedMessages: RenderedMessage[];
  withDateSeparator: boolean;
};

export type UseFloatingDateSeparatorResult = {
  /** Date of the first item Virtuoso rendered: a separator's own date, or a message's day. */
  firstRenderedItemDate: Date | null;
  /** Whether the first item Virtuoso rendered is an inline date separator. */
  isFirstRenderedItemDateSeparator: boolean;
  onItemsRendered: (rendered: RenderedMessage[]) => void;
};

// Date of the closest separator above `firstMessage`, else its `created_at`. Null for the intro.
function getFloatingDateForFirstMessage(
  firstMessage: RenderedMessage,
  processedMessages: RenderedMessage[],
  firstMessageIndex: number,
): Date | null {
  if (isIntroMessage(firstMessage)) return null;

  for (let i = firstMessageIndex - 1; i >= 0; i -= 1) {
    const item = processedMessages[i];
    if (isDateSeparatorMessage(item)) {
      return item.date;
    }
  }

  const msg = firstMessage as LocalMessage;
  const created = msg.created_at;
  if (created != null) {
    const d = nsToDate(created);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// A date separator carries its own date; a message takes the date of the separator above it.
function getFirstRenderedItemDate(
  firstItem: RenderedMessage,
  processedMessages: RenderedMessage[],
): Date | null {
  if (isDateSeparatorMessage(firstItem)) return firstItem.date;

  const firstItemIndex = processedMessages.findIndex((m) => m.id === firstItem.id);
  if (firstItemIndex < 0) return null;
  return getFloatingDateForFirstMessage(firstItem, processedMessages, firstItemIndex);
}

type FloatingDateState = {
  date: Date | null;
  isFirstRenderedItemDateSeparator: boolean;
};

const HIDDEN_STATE: FloatingDateState = {
  date: null,
  isFirstRenderedItemDateSeparator: false,
};

/**
 * Tracks the first item Virtuoso rendered for the floating date separator of
 * `VirtualizedMessageList`: its date, and whether it is a date separator. The rendered items carry
 * no geometry, and with a raised `overscan` or `increaseViewportBy.top` they include items above the
 * viewport, so the caller measures the DOM where it can.
 */
export const useFloatingDateSeparator = ({
  processedMessages,
  withDateSeparator,
}: UseFloatingDateSeparatorParams): UseFloatingDateSeparatorResult => {
  const [state, setState] = useState<FloatingDateState>(HIDDEN_STATE);

  const onItemsRendered = useCallback(
    (rendered: RenderedMessage[]) => {
      if (!withDateSeparator || processedMessages.length === 0) {
        setState(HIDDEN_STATE);
        return;
      }

      const valid = rendered.filter((m): m is RenderedMessage => m != null);
      if (valid.length === 0) {
        setState(HIDDEN_STATE);
        return;
      }

      const first = valid[0];
      const date = getFirstRenderedItemDate(first, processedMessages);
      const isFirstRenderedItemDateSeparator = isDateSeparatorMessage(first);

      setState((prev) => {
        const prevTime = prev.date?.getTime() ?? null;
        const nextTime = date?.getTime() ?? null;
        if (
          prevTime === nextTime &&
          prev.isFirstRenderedItemDateSeparator === isFirstRenderedItemDateSeparator
        ) {
          return prev;
        }
        return { date, isFirstRenderedItemDateSeparator };
      });
    },
    [withDateSeparator, processedMessages],
  );

  return {
    firstRenderedItemDate: state.date,
    isFirstRenderedItemDateSeparator: state.isFirstRenderedItemDateSeparator,
    onItemsRendered,
  };
};
