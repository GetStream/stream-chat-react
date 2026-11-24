import { useEffect, useRef, useState } from 'react';
import type { LocalMessage } from 'stream-chat';

type UseMessageSetKeyParams = {
  /** The paginator's focus signal: a jump to a message (its ID). */
  focusSignal?: { messageId: string } | null;
  messages?: LocalMessage[];
};

/**
 * Key for the Virtuoso list, renewed when the list jumps to a new location:
 * - the shown messages no longer include the previous first message (an empty list counts as
 *   having none);
 * - older messages arrived before the previous first message while the previous last message is
 *   gone: a page around a message just above the loaded one, which overlaps it. Counted as a
 *   prepend instead, the newest messages falling off the end would leave Virtuoso asking for items
 *   past the end of the list;
 * - a jump targets a message that arrived above the previous first message with the change just
 *   before it (the page loaded around the target, overlapping the loaded one, so the change looks
 *   like a prepend). react-virtuoso 4 drops a scroll to the target requested while it compensates
 *   for a prepend. Remounted, the list opens on the target (`initialTopMostItemIndex`).
 *
 * Appending, prepending or removing messages keeps the key, and so does the set the list mounted
 * with: remounting it would only repeat Virtuoso's initial positioning, during which
 * react-virtuoso 4 hides the list. So does a jump to a message already loaded before (one that
 * arrived live, one an earlier page brought), which scrolls to it.
 */
export const useMessageSetKey = ({ focusSignal, messages }: UseMessageSetKeyParams) => {
  // A counter, not a timestamp: two renewals within one millisecond still change the key.
  const [messageSetKey, setMessageSetKey] = useState(0);
  // IDs, not the array: the array can be updated in place (see usePrependedMessagesCount).
  const currentIds = useRef<string[]>([]);
  // The IDs before the messages last changed, which a jump's target is checked against: the
  // paginator shows the page and then emits the signal, which React 17 may render separately.
  const idsBeforeChange = useRef<string[]>([]);
  // The jump last checked, so one jump renews the key at most once.
  const checkedFocusSignal = useRef<UseMessageSetKeyParams['focusSignal']>(undefined);
  // Counts the runs below, to tie a jump to the change of messages right before it.
  const runRef = useRef(0);
  const lastChangeRunRef = useRef(0);
  const hasRun = useRef(false);
  const messageCount = messages?.length;

  useEffect(() => {
    runRef.current += 1;
    const previous = currentIds.current;
    const ids = (messages ?? []).map((message) => message.id);
    const messagesChanged =
      ids.length !== previous.length || ids.some((id, index) => id !== previous[index]);
    if (messagesChanged) {
      idsBeforeChange.current = previous;
      currentIds.current = ids;
      lastChangeRunRef.current = runRef.current;
    }
    if (!hasRun.current) {
      hasRun.current = true;
      // A jump the list mounted with is positioned by the mount itself.
      checkedFocusSignal.current = focusSignal;
      idsBeforeChange.current = ids;
      return;
    }

    let continuousSet = true;
    if (messagesChanged) {
      const previousFirstIndex = previous.length ? ids.indexOf(previous[0]) : -1;
      continuousSet =
        previousFirstIndex === 0 ||
        (previousFirstIndex > 0 && ids.includes(previous[previous.length - 1]));
    }

    let jumpedToLoadedTarget = false;
    if (focusSignal && focusSignal !== checkedFocusSignal.current) {
      checkedFocusSignal.current = focusSignal;
      const before = idsBeforeChange.current;
      const targetIndex = ids.indexOf(focusSignal.messageId);
      const previousFirstIndex = before.length ? ids.indexOf(before[0]) : -1;
      jumpedToLoadedTarget =
        // The change came with this jump: in this run, or in the run before when React rendered
        // the page and the signal separately.
        runRef.current - lastChangeRunRef.current <= 1 &&
        targetIndex !== -1 &&
        !before.includes(focusSignal.messageId) &&
        // It arrived above the previous first message: the change looks like a prepend.
        previousFirstIndex > targetIndex;
    }

    if (!continuousSet || jumpedToLoadedTarget) {
      setMessageSetKey((key) => key + 1);
    }
    // `messageCount`: an array updated in place keeps its identity.
  }, [focusSignal, messages, messageCount]);

  return {
    messageSetKey,
  };
};
