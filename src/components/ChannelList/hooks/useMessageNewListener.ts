import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, ChannelMemberResponse, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useMessageNewListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setChannels((channels) => {
        const channelInList = channels.find((channel) => channel.cid === event.cid);

        if (!channelInList && allowNewMessagesFromUnfilteredChannels && event.channel_type) {
          const channel = client.channel(event.channel_type, event.channel_id);

          const userIsNotChannelMember = !(channel.data?.members as (
            | string
            | ChannelMemberResponse<StreamChatGenerics>
          )[])?.find(
            (member) => (typeof member === 'string' ? member : member.user?.id) === client.user?.id,
          );
          if (userIsNotChannelMember) return channels;

          return uniqBy([channel, ...channels], 'cid');
        }

        if (!lockChannelOrder) return moveChannelUp({ channels, cid: event.cid || '' });

        return channels;
      });
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [client, lockChannelOrder]);
};
