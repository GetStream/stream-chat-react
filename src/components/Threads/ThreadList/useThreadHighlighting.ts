import { useEffect, useRef, useState } from 'react';
import type { ThreadManager } from 'stream-chat';

/**
 * The threads to flash as newly arrived, as a map of id to a callback that ends the flash.
 *
 * Arrival is taken from the manager's `unseenThreadIds`, which is appended to only when a thread
 * the list does not hold receives a message. Diffing the threads array instead would call every
 * thread that merely *appeared* new -- so the whole first page would flash on load, and so would
 * each page while scrolling, neither of which is an arrival.
 *
 * The ids have to be remembered as they are reported, because `reload()` clears `unseenThreadIds`
 * in the same update that puts those threads into the list: by the time they are on screen the
 * manager no longer calls them unseen.
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

    const unsubscribeThreads = threadManager.state.subscribeWithSelector(
      (state) => ({ threads: state.threads }),
      ({ threads }) => {
        if (!awaitingArrival.current.size) return;

        const arrived = threads.filter(({ id }) => awaitingArrival.current.has(id));
        if (!arrived.length) return;

        arrived.forEach(({ id }) => awaitingArrival.current.delete(id));

        // Merged, not replaced: a second arrival while the first is still flashing must not cut
        // the first one short.
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
