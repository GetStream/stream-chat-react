import type { DefaultStreamChatGenerics } from '../../../types';
import type { InternalSearchControllerState } from 'stream-chat';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: InternalSearchControllerState<StreamChatGenerics>,
) => ({ focusedMessage: nextValue.focusedMessage });

export const useSearchFocusedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { searchController } = useChatContext<StreamChatGenerics>('Channel');
  const { focusedMessage } = useStateStore(
    searchController.internalState,
    searchControllerStateSelector,
  );

  return focusedMessage;
};
