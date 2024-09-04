import { useChatContext } from 'context';
import { useStateStore } from './useStateStore';
import { ThreadManagerState } from 'stream-chat';

export const useThreadManagerState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadManagerState) => T,
) => {
  const { client } = useChatContext();

  return useStateStore(client.threads.state, selector);
};
