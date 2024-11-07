import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event, ExtendableGenerics } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { moveChannelUpwards } from '../utils';

export const isChannelPinned = <SCG extends ExtendableGenerics>({
  channel,
  userId,
}: {
  userId: string;
  channel?: Channel<SCG>;
}) => {
  if (!channel) return false;

  const member = channel.state.members[userId];

  return !!member?.pinned_at;
};

export const useMessageNewListener = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: Dispatch<SetStateAction<Array<Channel<SCG>>>>,
  customHandler?: (
    setChannels: Dispatch<SetStateAction<Array<Channel<SCG>>>>,
    event: Event<SCG>,
  ) => void,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
  considerPinnedChannels = false, // automatically set to true by checking sorting options (must include {pinned_at: -1/1})
) => {
  const { client } = useChatContext<SCG>('useMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event<SCG>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const targetChannelIndex = channels.findIndex((channel) => channel.cid === event.cid);
          const targetChannelExistsWithinList = targetChannelIndex >= 0;

          const isTargetChannelPinned = isChannelPinned({
            channel: channels[targetChannelIndex],
            userId: client.userID!,
          });

          if (
            // target channel is pinned
            (isTargetChannelPinned && considerPinnedChannels) ||
            // list order is locked
            lockChannelOrder ||
            // target channel is not within the loaded list and loading from cache is disallowed
            (!targetChannelExistsWithinList && !allowNewMessagesFromUnfilteredChannels)
          ) {
            return channels;
          }

          // we either have the channel to move or we pull it from the cache (or instantiate) if it's allowed
          const channelToMove: Channel<SCG> | null =
            channels[targetChannelIndex] ??
            (allowNewMessagesFromUnfilteredChannels && event.channel_type
              ? client.channel(event.channel_type, event.channel_id)
              : null);

          if (channelToMove) {
            return moveChannelUpwards({
              channels,
              channelToMove,
              channelToMoveIndexWithinChannels: targetChannelIndex,
              considerPinnedChannels,
              userId: client.userID!,
            });
          }

          return channels;
        });
      }
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [
    allowNewMessagesFromUnfilteredChannels,
    client,
    considerPinnedChannels,
    customHandler,
    lockChannelOrder,
    setChannels,
  ]);
};
