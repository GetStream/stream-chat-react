import { useChatContext } from 'context';
import { ThreadManagerState } from 'stream-chat';
import { useStateStore } from '../../../store';

export const useThreadManagerState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadManagerState) => T,
) => {
  const { client } = useChatContext();

  return useStateStore(client.threads.state, selector);
};
