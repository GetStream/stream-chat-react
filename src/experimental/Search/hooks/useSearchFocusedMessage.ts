import type { InternalSearchControllerState } from 'stream-chat';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = (nextValue: InternalSearchControllerState) => ({
  focusedMessage: nextValue.focusedMessage,
});

export const useSearchFocusedMessage = () => {
  const { searchController } = useChatContext('Channel');
  const { focusedMessage } = useStateStore(
    searchController._internalState,
    searchControllerStateSelector,
  );

  return focusedMessage;
};
