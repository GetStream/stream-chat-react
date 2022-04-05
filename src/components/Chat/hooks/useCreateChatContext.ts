import { useMemo } from 'react';

import type { ChatContextValue } from '../../../context/ChatContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  value: ChatContextValue<StreamChatGenerics>,
) => {
  const {
    channel,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    theme,
    useImageFlagEmojisOnWindows,
  } = value;

  const channelCid = channel?.cid;
  const clientValues = `${client.clientID}${Object.keys(client.activeChannels).length}${
    Object.keys(client.listeners).length
  }${client.mutedChannels.length}
  ${client.user?.id}`;
  const mutedUsersLength = mutes.length;

  const chatContext: ChatContextValue<StreamChatGenerics> = useMemo(
    () => ({
      channel,
      client,
      closeMobileNav,
      customClasses,
      getAppSettings,
      latestMessageDatesByChannels,
      mutes,
      navOpen,
      openMobileNav,
      setActiveChannel,
      theme,
      useImageFlagEmojisOnWindows,
    }),
    [channelCid, clientValues, getAppSettings, mutedUsersLength, navOpen],
  );

  return chatContext;
};
