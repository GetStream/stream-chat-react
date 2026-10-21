import type { ThreadState } from 'stream-chat';
import { useThreadListItemContext } from '../ThreadList';
import { useThreadContext } from '../ThreadContext';
import { useStateStore } from '../../../store/';

/**
 * @description Returns thread state from `ThreadListItemContext`, falling back to `ThreadContext`.
 */
export const useThreadState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadState) => T,
) => {
  const listItemThread = useThreadListItemContext();
  const thread = useThreadContext();

  return useStateStore(listItemThread?.state ?? thread?.state, selector);
};
