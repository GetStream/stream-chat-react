import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

export const useOpenThreadHandler = (
  message?: StreamMessage,
  customOpenThread?: (message: StreamMessage, event: React.BaseSyntheticEvent) => void,
): ReactEventHandler => {
  const { openThread: channelOpenThread } =
    useChannelActionContext('useOpenThreadHandler');

  const openThread = customOpenThread || channelOpenThread;

  return (event) => {
    if (!openThread || !message) {
      console.warn(
        'Open thread handler was called but it is missing one of its parameters',
      );
      return;
    }

    openThread(message, event);
  };
};
