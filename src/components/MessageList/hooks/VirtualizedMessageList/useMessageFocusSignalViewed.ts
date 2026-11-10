import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { MessageFocusSignal, MessagePaginator } from 'stream-chat';

/** The element Virtuoso renders the items into (react-virtuoso ≥ 4.7.9 test ID). */
const ITEM_LIST_SELECTOR = '[data-testid="virtuoso-item-list"]';

/** react-virtuoso 4 keeps a freshly mounted item list hidden until it reaches its initial item. */
const isItemListHidden = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(ITEM_LIST_SELECTOR)?.style.visibility === 'hidden';

type UseMessageFocusSignalViewedParams = {
  /** Wraps the Virtuoso list; the focused message's item is looked up inside it. */
  containerRef: RefObject<HTMLElement | null>;
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
 * In a virtualized list the focused message may not be rendered when the signal arrives (its page
 * is still loading, or Virtuoso has not scrolled to it yet), so its item is looked up again
 * whenever the rendered items change. While react-virtuoso 4 keeps a freshly mounted list hidden
 * and unpositioned, nothing counts as viewed (react-virtuoso 2 never hides it). Where "viewed" cannot be observed, the countdown
 * starts at once.
 *
 * Returns a ref holding the token of the last signal whose message was seen viewed, so the caller
 * can stop re-centering on a message the reader has already seen. It is not set when "viewed"
 * cannot be observed.
 */
export const useMessageFocusSignalViewed = ({
  containerRef,
  messageFocusSignal,
  messagePaginator,
  scrollElement,
}: UseMessageFocusSignalViewedParams) => {
  const viewedTokenRef = useRef<number | null>(null);
  const clearScheduledTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (!messageFocusSignal) return;
    const { messageId, token } = messageFocusSignal;
    // The list remounts (new message set, new scroller) after the countdown started: done already.
    if (clearScheduledTokenRef.current === token) return;

    const scheduleClear = () => {
      clearScheduledTokenRef.current = token;
      messagePaginator.scheduleMessageFocusSignalClear({ token });
    };

    if (
      typeof IntersectionObserver === 'undefined' ||
      typeof MutationObserver === 'undefined'
    ) {
      // "Viewed" cannot be observed, so start the countdown now to let the highlight clear.
      scheduleClear();
      return;
    }

    const container = containerRef.current;
    // Virtuoso has not reported its scroller yet; this effect runs again once it does.
    if (!container || !scrollElement) return;

    const root = isWindow(scrollElement) ? null : scrollElement;
    let observed: Element | null = null;
    let wasHidden = isItemListHidden(container);

    const viewObserver = new IntersectionObserver(
      (entries) => {
        const entry = [...entries].reverse().find((e) => e.target === observed);
        if (!entry || isItemListHidden(container)) return;
        const rootHeight = (root ? root.clientHeight : window.innerHeight) || 1;
        // Viewed: half the message is visible, or the visible slice fills half the viewport.
        const viewed =
          entry.isIntersecting &&
          (entry.intersectionRatio >= 0.5 ||
            entry.intersectionRect.height >= rootHeight * 0.5);
        if (!viewed) return;
        disconnect();
        viewedTokenRef.current = token;
        scheduleClear();
      },
      { root, threshold: [0, 0.5, 1] },
    );

    const observeTarget = () => {
      const target = container.querySelector(`[data-message-id='${messageId}']`);
      const hidden = isItemListHidden(container);
      const revealed = wasHidden && !hidden;
      wasHidden = hidden;
      // Revealing the list does not move the item, so the view observer would not report it again:
      // re-observing makes it report the item's current intersection.
      if (target === observed && !revealed) return;
      if (observed) viewObserver.unobserve(observed);
      observed = target;
      if (target) viewObserver.observe(target);
    };

    // Virtuoso adds and removes items as the list scrolls and reveals its item list through its
    // inline style, so both are watched until the message is viewed.
    const renderObserver = new MutationObserver(observeTarget);
    const disconnect = () => {
      viewObserver.disconnect();
      renderObserver.disconnect();
    };

    renderObserver.observe(container, {
      attributeFilter: ['style'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    observeTarget();

    return disconnect;
  }, [containerRef, messageFocusSignal, messagePaginator, scrollElement]);

  return viewedTokenRef;
};
