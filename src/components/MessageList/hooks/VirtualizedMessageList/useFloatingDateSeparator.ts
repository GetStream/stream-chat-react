import { useCallback, useState } from 'react';

import type { RenderedMessage } from '../../utils';
import { isDateSeparatorMessage, isIntroMessage } from '../../utils';
import type { LocalMessage } from 'stream-chat';

export type UseFloatingDateSeparatorParams = {
  disableDateSeparator: boolean;
  processedMessages: RenderedMessage[];
};

export type UseFloatingDateSeparatorResult = {
  floatingDate: Date | null;
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
): Date | null {
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
  const created = msg.created_at;
  if (created) {
    const d = new Date(created);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Controls when to show the floating date separator (Slack-like: fixed at top when scrolling).
 * Show when no in-flow date separator is visible and we've scrolled past one.
 */
const HIDDEN_STATE = { date: null, visible: false } as const;

export const useFloatingDateSeparator = ({
  disableDateSeparator,
  processedMessages,
}: UseFloatingDateSeparatorParams): UseFloatingDateSeparatorResult => {
  const [state, setState] = useState<{
    date: Date | null;
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

      // If first visible item is a date separator, it's in view — hide floating
      if (isDateSeparatorMessage(first)) {
        setState(HIDDEN_STATE);
        return;
      }

      // Check if any date separator is visible — if so, hide floating
      const hasVisibleDateSeparator = valid.some(isDateSeparatorMessage);
      if (hasVisibleDateSeparator) {
        setState(HIDDEN_STATE);
        return;
      }

      // First visible is a message; find its date
      const firstIndex = processedMessages.findIndex((m) => m.id === first.id);
      const date =
        firstIndex >= 0
          ? getFloatingDateForFirstMessage(first, processedMessages, firstIndex)
          : null;

      const visible = date !== null;
      setState((prev) => {
        const prevTime = prev.date?.getTime() ?? null;
        const nextTime = date?.getTime() ?? null;
        if (prev.visible === visible && prevTime === nextTime) return prev;
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
