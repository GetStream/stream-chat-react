import { RetrySendMessage, useChannelActionContext } from '../../../context/ChannelActionContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useRetryHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  customRetrySendMessage?: RetrySendMessage<StreamChatGenerics>,
): RetrySendMessage<StreamChatGenerics> => {
  const { retrySendMessage: contextRetrySendMessage } = useChannelActionContext<StreamChatGenerics>(
    'useRetryHandler',
  );

  const retrySendMessage = customRetrySendMessage || contextRetrySendMessage;

  return async (message) => {
    if (message) {
      await retrySendMessage(message);
    }
  };
};
