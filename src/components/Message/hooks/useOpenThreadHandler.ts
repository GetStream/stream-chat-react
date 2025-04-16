import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const useOpenThreadHandler = (
  message?: LocalMessage,
  customOpenThread?: (message: LocalMessage, event: React.BaseSyntheticEvent) => void,
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
