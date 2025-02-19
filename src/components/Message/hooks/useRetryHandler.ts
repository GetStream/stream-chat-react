import type { RetrySendMessage } from '../../../context/ChannelActionContext';
import { useChannelActionContext } from '../../../context/ChannelActionContext';

export const useRetryHandler = (
  customRetrySendMessage?: RetrySendMessage,
): RetrySendMessage => {
  const { retrySendMessage: contextRetrySendMessage } =
    useChannelActionContext('useRetryHandler');

  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;

  return async (message) => {
    if (message) {
      await retrySendMessage(message);
    }
  };
};
