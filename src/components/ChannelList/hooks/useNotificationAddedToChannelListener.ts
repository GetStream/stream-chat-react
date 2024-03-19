import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../../../utils/getChannel';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useNotificationAddedToChannelListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useNotificationAddedToChannelListener');

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel({
          client,
          id: event.channel.id,
          members: event.channel.members?.reduce<string[]>((acc, { user, user_id }) => {
            const userId = user_id || user?.id;
            if (userId) {
              acc.push(userId);
            }
            return acc;
          }, []),
          type: event.channel.type,
        });
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', handleEvent);

    return () => {
      client.off('notification.added_to_channel', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
