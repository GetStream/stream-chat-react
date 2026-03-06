import { useMemo } from 'react';

import type { ChatContextValue } from '../../../context/ChatContext';

export const useCreateChatContext = (value: ChatContextValue) => {
  const {
    channelsQueryState,
    client,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    latestMessageDatesByChannels,
    navOpen,
    openMobileNav,
    searchController,
    theme,
    useImageFlagEmojisOnWindows,
  } = value;

  const channelsQueryError = channelsQueryState.error;
  const channelsQueryInProgress = channelsQueryState.queryInProgress;
  const clientValues = `${client.clientID}${Object.keys(client.activeChannels).length}${
    Object.keys(client.listeners).length
  }${client.mutedChannels.length}
  ${client.user?.id}`;

  const chatContext: ChatContextValue = useMemo(
    () => ({
      channelsQueryState,
      client,
      customClasses,
      getAppSettings,
      isMessageAIGenerated,
      latestMessageDatesByChannels,
      navOpen,
      openMobileNav,
      searchController,
      theme,
      useImageFlagEmojisOnWindows,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelsQueryError,
      channelsQueryInProgress,
      clientValues,
      getAppSettings,
      searchController,
      navOpen,
      isMessageAIGenerated,
    ],
  );

  return chatContext;
};
