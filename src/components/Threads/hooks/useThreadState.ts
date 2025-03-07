import type { ThreadState } from 'stream-chat';
import { useThreadListItemContext } from '../ThreadList';
import { useThreadContext } from '../ThreadContext';
import { useStateStore } from '../../../store/';

/**
 * @description returns thread state, prioritizes `ThreadListItemContext` falls back to `ThreadContext` if not former is not present
 */
export const useThreadState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadState) => T,
) => {
  const listItemThread = useThreadListItemContext();
  const thread = useThreadContext();

  return useStateStore(listItemThread?.state ?? thread?.state, selector);
};
