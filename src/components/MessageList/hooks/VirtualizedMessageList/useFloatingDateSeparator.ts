import { useCallback, useState } from 'react';

import type { RenderedMessage } from '../../utils';
import { isDateSeparatorMessage, isIntroMessage } from '../../utils';
import type { LocalMessage } from 'stream-chat';

export type UseFloatingDateSeparatorParams = {
  disableDateSeparator: boolean;
  processedMessages: RenderedMessage[];
};

export type UseFloatingDateSeparatorResult = {
  floatingDate: number | null;
  onItemsRendered: (rendered: RenderedMessage[]) => void;
  showFloatingDate: boolean;
};

/**
 * Returns the date to show in the floating date separator based on currently visible messages.
 * When the first visible item is a message (not a date separator), we've scrolled past its
 * date separator — find that separator's date.
 */
function getFloatingDateForFirstMessage(
  firstMessage: RenderedMessage,
  processedMessages: RenderedMessage[],
  firstMessageIndex: number,
): number | null {
  if (isIntroMessage(firstMessage)) return null;

  // Walk backwards to find the last date separator before this message
  for (let i = firstMessageIndex - 1; i >= 0; i -= 1) {
    const item = processedMessages[i];
    if (isDateSeparatorMessage(item)) {
      return item.date;
    }
  }

  // No preceding date separator; use message's created_at
  const msg = firstMessage as LocalMessage;
  return msg.created_at ?? null;
}

function getFloatingDateForFirstItem(
  firstItem: RenderedMessage,
  processedMessages: RenderedMessage[],
  firstItemIndex: number,
): number | null {
  if (isDateSeparatorMessage(firstItem)) return firstItem.date;

  return getFloatingDateForFirstMessage(firstItem, processedMessages, firstItemIndex);
}

/**
 * Controls the floating date separator as a sticky "current section" label.
 * It follows the date separator represented by the first visible item.
 */
const HIDDEN_STATE = { date: null, visible: false } as const;

export const useFloatingDateSeparator = ({
  disableDateSeparator,
  processedMessages,
}: UseFloatingDateSeparatorParams): UseFloatingDateSeparatorResult => {
  const [state, setState] = useState<{
    date: number | null;
    visible: boolean;
  }>(HIDDEN_STATE);

  const onItemsRendered = useCallback(
    (rendered: RenderedMessage[]) => {
      if (disableDateSeparator || processedMessages.length === 0) {
        setState(HIDDEN_STATE);
        return;
      }

      const valid = rendered.filter((m): m is RenderedMessage => m != null);
      if (valid.length === 0) {
        setState(HIDDEN_STATE);
        return;
      }

      const first = valid[0];
      const firstIndex = processedMessages.findIndex((m) => m.id === first.id);
      const date =
        firstIndex >= 0
          ? getFloatingDateForFirstItem(first, processedMessages, firstIndex)
          : null;

      const visible = date !== null;
      setState((prev) => {
        // Both are wire timestamps now, so they compare directly.
        if (prev.visible === visible && prev.date === date) return prev;
        return { date, visible };
      });
    },
    [disableDateSeparator, processedMessages],
  );

  return {
    floatingDate: state.date,
    onItemsRendered,
    showFloatingDate: !!state.date && state.visible,
  };
};
