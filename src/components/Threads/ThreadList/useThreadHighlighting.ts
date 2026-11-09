import { useEffect, useRef, useState } from 'react';
import type { ThreadManager } from 'stream-chat';

/**
 * Threads to flash as newly arrived, as a map of thread ID to a callback that ends the flash.
 *
 * Arrival comes from the manager's `unseenThreadIds` (appended to only when a thread the list does
 * not hold receives a message), not from diffing the list, which would flash the whole first page
 * on load and every page while scrolling. IDs are remembered when reported because `reload()`
 * clears `unseenThreadIds` once it has put those threads into the list, and the two stores update
 * in either order.
 */
export const useThreadHighlighting = (threadManager: ThreadManager) => {
  const [threadsToHighlight, setThreadsToHighlight] = useState<
    Record<string, () => void>
  >({});
  const awaitingArrival = useRef(new Set<string>());

  useEffect(() => {
    const unsubscribeUnseen = threadManager.state.subscribeWithSelector(
      (state) => ({ unseenThreadIds: state.unseenThreadIds }),
      ({ unseenThreadIds }) => {
        unseenThreadIds.forEach((id) => awaitingArrival.current.add(id));
      },
    );

    const unsubscribeThreads = threadManager.paginator.state.subscribeWithSelector(
      (state) => ({ threads: state.items ?? [] }),
      ({ threads }) => {
        if (!awaitingArrival.current.size) return;

        const arrived = threads.filter(({ id }) => awaitingArrival.current.has(id));
        if (!arrived.length) return;

        arrived.forEach(({ id }) => awaitingArrival.current.delete(id));

        // Merged, not replaced, so a second arrival does not cut the first flash short.
        setThreadsToHighlight((current) => {
          const next = { ...current };
          for (const { id } of arrived) {
            next[id] = () =>
              setThreadsToHighlight((pv) => {
                const copy = { ...pv };
                delete copy[id];
                return copy;
              });
          }
          return next;
        });
      },
    );

    return () => {
      unsubscribeUnseen();
      unsubscribeThreads();
    };
  }, [threadManager]);

  return threadsToHighlight;
};
