import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useNotificationRemovedFromChannelListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
) => {
  const { client } = useChatContext<StreamChatGenerics>(
    'useNotificationRemovedFromChannelListener',
  );

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => channels.filter((channel) => channel.cid !== event.channel?.cid));
      }
    };

    client.on('notification.removed_from_channel', handleEvent);

    return () => {
      client.off('notification.removed_from_channel', handleEvent);
    };
  }, [customHandler]);
};
