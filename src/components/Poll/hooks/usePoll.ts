import { usePollContext } from '../../../context';
import type { DefaultStreamChatGenerics } from '../../../types';

export const usePoll = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { poll } = usePollContext<StreamChatGenerics>();
  return poll;
};
