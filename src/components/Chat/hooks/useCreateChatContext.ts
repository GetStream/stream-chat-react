import { useMemo } from 'react';

import type { ChatContextValue } from '../../../context/ChatContext';

export const useCreateChatContext = (value: ChatContextValue) => {
  const {
    channelPaginatorsOrchestrator,
    channelsQueryState,
    client,
    customClasses,
    getAppSettings,
    isMessageAIGenerated,
    latestMessageDatesByChannels,
    mutes,
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
  const mutedUsersLength = mutes.length;

  const chatContext: ChatContextValue = useMemo(
    () => ({
      channelPaginatorsOrchestrator,
      channelsQueryState,
      client,
      customClasses,
      getAppSettings,
      isMessageAIGenerated,
      latestMessageDatesByChannels,
      mutes,
      searchController,
      theme,
      useImageFlagEmojisOnWindows,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelPaginatorsOrchestrator,
      channelsQueryError,
      channelsQueryInProgress,
      clientValues,
      getAppSettings,
      searchController,
      mutedUsersLength,
      isMessageAIGenerated,
    ],
  );

  return chatContext;
};
