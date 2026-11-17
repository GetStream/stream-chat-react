import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { MessageFocusSignal, MessagePaginator } from 'stream-chat';

import {
  findMessageElement,
  isMessageViewed,
  MESSAGE_VIEWED_THRESHOLDS,
} from '../../messageFocus';

type UseMessageFocusSignalViewedParams = {
  /** Wraps the Virtuoso list; the focused message's item is looked up inside it. */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether the focused message is among the list's processed messages. */
  isMessageInList: boolean;
  messageFocusSignal: MessageFocusSignal | null | undefined;
  messagePaginator: MessagePaginator;
  /** The element that scrolls the list, or the window in the window-scroll modes. */
  scrollElement: HTMLElement | Window | null;
};

const isWindow = (element: HTMLElement | Window): element is Window =>
  typeof window !== 'undefined' && element === window;

/**
 * Starts the dismissal countdown of the message-focus signal (a deep-link or quoted-reply jump, or
 * jump-to-latest) once the focused message has been viewed, as `MessageList` does. `MessagePaginator`
 * leaves that countdown to the list, so a list that never starts it keeps the message highlighted
 * until the next jump.
 *
 * In a virtualized list the focused message may not be rendered when the signal arrives (Virtuoso
 * has not scrolled to it yet), so its item is looked up again whenever the rendered items change.
 * As in `MessageList`, the countdown starts at once where the message is not in the list (e.g. a
 * deleted message under `hideDeletedMessages`) or where "viewed" cannot be observed.
 *
 * Signals are tracked by object, not by token: tokens count per paginator, so a list that switches
 * paginators can see the same token again for a different jump. A signal object is new for every
 * jump and stays the same while the list remounts.
 *
 * Returns a ref holding the last signal whose message was seen viewed, so the caller can stop
 * re-centering on a message the reader has already seen. It is not set when "viewed" cannot be
 * observed.
 */
export const useMessageFocusSignalViewed = ({
  containerRef,
  isMessageInList,
  messageFocusSignal,
  messagePaginator,
  scrollElement,
}: UseMessageFocusSignalViewedParams) => {
  const viewedSignalRef = useRef<MessageFocusSignal | null>(null);
  const clearScheduledSignalRef = useRef<MessageFocusSignal | null>(null);

  useEffect(() => {
    if (!messageFocusSignal) return;
    // The list remounts (new message set, new scroller) after the countdown started: done already.
    if (clearScheduledSignalRef.current === messageFocusSignal) return;
    const { messageId, token } = messageFocusSignal;

    const scheduleClear = () => {
      clearScheduledSignalRef.current = messageFocusSignal;
      messagePaginator.scheduleMessageFocusSignalClear({ token });
    };

    if (
      !isMessageInList ||
      typeof IntersectionObserver === 'undefined' ||
      typeof MutationObserver === 'undefined'
    ) {
      // The message will not render, or "viewed" cannot be observed: start the countdown now to
      // let the highlight clear.
      scheduleClear();
      return;
    }

    const container = containerRef.current;
    // Virtuoso has not reported its scroller yet; this effect runs again once it does.
    if (!container || !scrollElement) return;

    const root = isWindow(scrollElement) ? null : scrollElement;
    let observed: Element | null = null;

    const viewObserver = new IntersectionObserver(
      (entries) => {
        const entry = [...entries].reverse().find((e) => e.target === observed);
        if (!entry) return;
        const rootHeight = root ? root.clientHeight : window.innerHeight;
        if (!isMessageViewed(entry, rootHeight)) return;
        disconnect();
        viewedSignalRef.current = messageFocusSignal;
        scheduleClear();
      },
      { root, threshold: MESSAGE_VIEWED_THRESHOLDS },
    );

    const observeTarget = () => {
      const target = findMessageElement(container, messageId);
      if (target === observed) return;
      if (observed) viewObserver.unobserve(observed);
      observed = target;
      if (target) viewObserver.observe(target);
    };

    // Virtuoso adds and removes items as the list scrolls, so they are watched until the message
    // is viewed.
    const renderObserver = new MutationObserver(observeTarget);
    const disconnect = () => {
      viewObserver.disconnect();
      renderObserver.disconnect();
    };

    renderObserver.observe(container, { childList: true, subtree: true });
    observeTarget();

    return disconnect;
  }, [
    containerRef,
    isMessageInList,
    messageFocusSignal,
    messagePaginator,
    scrollElement,
  ]);

  return viewedSignalRef;
};
