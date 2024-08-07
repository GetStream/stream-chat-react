import { useChatContext } from 'context';
import { useSimpleStateStore } from './useSimpleStateStore';
import { ThreadManagerState } from 'stream-chat';

export const useThreadManagerState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadManagerState) => T,
) => {
  const { client } = useChatContext();

  return useSimpleStateStore(client.threads.state, selector);
};
