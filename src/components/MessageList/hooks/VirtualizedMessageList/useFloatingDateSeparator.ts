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
  floatingDate: Date | null;
  onItemsRendered: (rendered: RenderedMessage[]) => void;
  showFloatingDate: boolean;
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

function getFloatingDateForFirstItem(
  firstItem: RenderedMessage,
  processedMessages: RenderedMessage[],
  firstItemIndex: number,
): Date | null {
  if (isDateSeparatorMessage(firstItem)) return firstItem.date;

  return getFloatingDateForFirstMessage(firstItem, processedMessages, firstItemIndex);
}

const HIDDEN_STATE = { date: null, visible: false } as const;

/** State of the floating date separator, a sticky label showing the first visible item's date. */
export const useFloatingDateSeparator = ({
  processedMessages,
  withDateSeparator,
}: UseFloatingDateSeparatorParams): UseFloatingDateSeparatorResult => {
  const [state, setState] = useState<{
    date: Date | null;
    visible: boolean;
  }>(HIDDEN_STATE);

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
      const firstIndex = processedMessages.findIndex((m) => m.id === first.id);
      const date =
        firstIndex >= 0
          ? getFloatingDateForFirstItem(first, processedMessages, firstIndex)
          : null;

      const visible = date !== null;
      setState((prev) => {
        const prevTime = prev.date?.getTime() ?? null;
        const nextTime = date?.getTime() ?? null;
        if (prev.visible === visible && prevTime === nextTime) return prev;
        return { date, visible };
      });
    },
    [withDateSeparator, processedMessages],
  );

  return {
    floatingDate: state.date,
    onItemsRendered,
    showFloatingDate: !!state.date && state.visible,
  };
};
