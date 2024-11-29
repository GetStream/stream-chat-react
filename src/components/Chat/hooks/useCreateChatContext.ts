import { useMemo } from 'react';

import type { ChatContextValue } from '../../../context/ChatContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { DefaultSearchSources, SearchSource } from '../../Search/SearchController';

export const useCreateChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources
>(
  value: ChatContextValue<StreamChatGenerics, SearchSources>,
) => {
  const {
    channel,
    channelsQueryState,
    client,
    closeMobileNav,
    customClasses,
    getAppSettings,
    latestMessageDatesByChannels,
    mutes,
    navOpen,
    openMobileNav,
    searchController,
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

  const chatContext: ChatContextValue<StreamChatGenerics, SearchSources> = useMemo(
    () => ({
      channel,
      channelsQueryState,
      client,
      closeMobileNav,
      customClasses,
      getAppSettings,
      latestMessageDatesByChannels,
      mutes,
      navOpen,
      openMobileNav,
      searchController,
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
      searchController,
      mutedUsersLength,
      navOpen,
    ],
  );

  return chatContext;
};
