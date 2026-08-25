import type { InternalSearchControllerState } from 'stream-chat';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = (nextValue: InternalSearchControllerState) => ({
  focusedMessage: nextValue.focusedMessage,
});

export const useSearchFocusedMessage = () => {
  // todo: searchController should be provided with SearchContextProvider that has to be introduced
  const { searchController } = useChatContext();
  const { focusedMessage } = useStateStore(
    searchController._internalState,
    searchControllerStateSelector,
  );

  return focusedMessage;
};
