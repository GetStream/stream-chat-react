import type { ThreadManagerState } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

export const useThreadManagerState = <T extends readonly unknown[]>(
  selector: (nextValue: ThreadManagerState) => T,
) => {
  const { client } = useChatContext();

  return useStateStore(client.threads.state, selector);
};
