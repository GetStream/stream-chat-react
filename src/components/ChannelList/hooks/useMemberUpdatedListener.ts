import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Channel, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../context';
import { findLastPinnedChannelIndex } from '../utils';

export const useMemberUpdatedListener = <SCG extends ExtendableGenerics>({
  considerPinnedChannels = false,
  lockChannelOrder = false,
  setChannels,
}: {
  setChannels: Dispatch<SetStateAction<Channel<SCG>[]>>;
  considerPinnedChannels?: boolean;
  lockChannelOrder?: boolean;
}) => {
  const { client } = useChatContext<SCG>();

  useEffect(() => {
    // do nothing if channel order is locked or pinned channels aren't being considered
    if (lockChannelOrder || !considerPinnedChannels) return;

    const subscription = client.on('member.updated', (e) => {
      if (!e.member || !e.channel_type) return;
      // const member = e.member;
      const channelType = e.channel_type;
      const channelId = e.channel_id;

      setChannels((currentChannels) => {
        const targetChannel = client.channel(channelType, channelId);
        // assumes that channel instances are not changing
        const targetChannelIndex = currentChannels.indexOf(targetChannel);
        const targetChannelExistsWithinList = targetChannelIndex >= 0;

        const newChannels = [...currentChannels];

        if (targetChannelExistsWithinList) {
          newChannels.splice(targetChannelIndex, 1);
        }

        const lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
        const newTargetChannelIndex =
          typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0;

        // skip re-render if the position of the channel does not change
        if (currentChannels[newTargetChannelIndex] === targetChannel) {
          return currentChannels;
        }

        newChannels.splice(newTargetChannelIndex, 0, targetChannel);

        return newChannels;
      });
    });

    return subscription.unsubscribe;
  }, [client, considerPinnedChannels, lockChannelOrder, setChannels]);
};
