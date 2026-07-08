import type { MessagePaginator } from 'stream-chat';
import { useChannel } from '../context';
import { useThreadContext } from '../components';

/**
 * Hook can be used only in children of <Channel/> and <Thread/> components.
 */
export const useMessagePaginator = (): MessagePaginator => {
  const channel = useChannel();
  const thread = useThreadContext();

  return thread?.messagePaginator ?? channel.messagePaginator;
};
