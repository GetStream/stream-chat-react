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
    channels,
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    setChannels,
    theme,
    themeVersion,
    useImageFlagEmojisOnWindows,
  } = value;

  const channelCid = channel?.cid;
  const channelsQueryError = channelsQueryState.error;
  const channelsQueryInProgress = channelsQueryState.queryInProgress;
  const clientValues = `${client.clientID}${Object.keys(client.activeChannels).length}${
    Object.keys(client.listeners).length
  }${client.mutedChannels.length}
  ${client.user?.id}`;
  const mutedUsersLength = mutes.length;

  const chatContext: ChatContextValue<StreamChatGenerics> = useMemo(
    () => ({
      channel,
      channels,
      channelsQueryState,
      client,
      closeMobileNav,
      customClasses,
      getAppSettings,
      latestMessageDatesByChannels,
      mutes,
      navOpen,
      openMobileNav,
      setActiveChannel,
      setChannels,
      theme,
      themeVersion,
      useImageFlagEmojisOnWindows,
    }),
    [
      channelCid,
      channelsQueryError,
      channelsQueryInProgress,
      channels,
      clientValues,
      getAppSettings,
      mutedUsersLength,
      navOpen,
      setChannels,
    ],
  );

  return chatContext;
};
