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
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    theme,
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
      channelsQueryState,
      client,
      closeMobileNav,
      customClasses,
      getAppSettings,
      isMessageAIGenerated,
      latestMessageDatesByChannels,
      mutes,
      navOpen,
      openMobileNav,
      setActiveChannel,
      theme,
      useImageFlagEmojisOnWindows,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelCid,
      channelsQueryError,
      channelsQueryInProgress,
      clientValues,
      getAppSettings,
      mutedUsersLength,
      navOpen,
    ],
  );

  return chatContext;
};
