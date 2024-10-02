import { usePollContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';
import { useStateStore } from '../../../store';
import { PollState } from 'stream-chat';

export const usePollState = <
  T extends readonly unknown[],
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  selector: (nextValue: PollState<StreamChatGenerics>) => T,
) => {
  const { poll } = usePollContext<StreamChatGenerics>('usePollState');
  return useStateStore(poll.state, selector);
};
