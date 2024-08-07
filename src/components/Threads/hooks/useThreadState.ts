import { ThreadState } from 'stream-chat';
import { useSimpleStateStore } from './useSimpleStateStore';
import { useThreadListItemContext } from '../ThreadList';
import { useThreadContext } from '../ThreadContext';

/**
 * @description returns thread state, prioritizes `ThreadListItemContext`, uses `ThreadContext` if not present
 */
export const useThreadState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadState) => T,
) => {
  const listItemThread = useThreadListItemContext();
  const thread = useThreadContext();

  return useSimpleStateStore(listItemThread?.state ?? thread.state, selector);
};
