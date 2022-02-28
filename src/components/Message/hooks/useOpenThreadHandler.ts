import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useOpenThreadHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  customOpenThread?: (
    message: StreamMessage<StreamChatGenerics>,
    event: React.BaseSyntheticEvent,
  ) => void,
): ReactEventHandler => {
  const { openThread: channelOpenThread } = useChannelActionContext<StreamChatGenerics>(
    'useOpenThreadHandler',
  );

  const openThread = customOpenThread || channelOpenThread;

  return (event) => {
    if (!openThread || !message) {
      console.warn('Open thread handler was called but it is missing one of its parameters');
      return;
    }

    openThread(message, event);
  };
};
