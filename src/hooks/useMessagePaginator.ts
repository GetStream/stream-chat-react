import type { MessagePaginator } from 'stream-chat';
import { useChannel } from '../context';
import { useThreadContext } from '../components';

/**
 * Returns the message paginator of the thread when inside one, otherwise of the channel. Must be
 * used within a `Channel` or `Thread` subtree.
 */
export const useMessagePaginator = (): MessagePaginator => {
  const channel = useChannel();
  const thread = useThreadContext();

  return thread?.messagePaginator ?? channel.messagePaginator;
};
