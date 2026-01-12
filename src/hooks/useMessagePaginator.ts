import type { MessagePaginator } from 'stream-chat';
import { useChannelStateContext } from '../context';
import { useThreadContext } from '../components';

/**
 * Hook can be used only in children of <Channel/> and <Thread/> components.
 */
export const useMessagePaginator = (): MessagePaginator => {
  const { channel } = useChannelStateContext();
  const thread = useThreadContext(); // may be undefined

  return thread?.messagePaginator ?? channel?.messagePaginator;
};
