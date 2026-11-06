import { useMessageContext } from '../../../context';
import { useThreadContext } from '../../Threads';

/**
 * Whether the message in `MessageContext` is the parent message of the thread in `ThreadContext`.
 * A thread's id is its parent message's id, so inside a thread only the parent message matches.
 *
 * @returns True for the thread's parent message, false for its replies and outside a thread.
 */
export const useIsRenderedAsThreadParent = () => {
  const thread = useThreadContext();
  const { message } = useMessageContext();
  return !!thread && thread.id === message.id;
};
