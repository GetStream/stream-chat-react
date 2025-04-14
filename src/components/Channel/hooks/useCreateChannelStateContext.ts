import { useMemo } from 'react';

import { isDate, isDayOrMoment } from '../../../i18n';

import type { ChannelStateContextValue } from '../../../context/ChannelStateContext';

export const useCreateChannelStateContext = (
  value: Omit<ChannelStateContextValue, 'channelCapabilities'> & {
    channelCapabilitiesArray: string[];
    skipMessageDataMemoization?: boolean;
  },
) => {
  const {
    acceptedFiles,
    channel,
    channelCapabilitiesArray = [],
    channelConfig,
    channelUnreadUiState,
    dragAndDropWindow,
    error,
    giphyVersion,
    hasMore,
    hasMoreNewer,
    highlightedMessageId,
    imageAttachmentSizeHandler,
    loading,
    loadingMore,
    maxNumberOfFiles,
    members,
    messageDraftsEnabled,
    messages = [],
    multipleUploads,
    mutes,
    notifications,
    pinnedMessages,
    read = {},
    shouldGenerateVideoThumbnail,
    skipMessageDataMemoization,
    suppressAutoscroll,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages = [],
    videoAttachmentSizeHandler,
    watcher_count,
    watcherCount,
    watchers,
  } = value;

  const channelId = channel.cid;
  const lastRead = channel.initialized && channel.lastRead()?.getTime();
  const membersLength = Object.keys(members || []).length;
  const notificationsLength = notifications.length;
  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers
    .map(({ last_read }) => last_read.toISOString())
    .join();
  const threadMessagesLength = threadMessages?.length;

  const channelCapabilities: Record<string, boolean> = {};

  channelCapabilitiesArray.forEach((capability) => {
    channelCapabilities[capability] = true;
  });

  const memoizedMessageData = skipMessageDataMemoization
    ? messages
    : messages
        .map(
          ({
            deleted_at,
            latest_reactions,
            pinned,
            reply_count,
            status,
            updated_at,
            user,
          }) =>
            `${deleted_at}${
              latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
            }${pinned}${reply_count}${status}${
              updated_at && (isDayOrMoment(updated_at) || isDate(updated_at))
                ? updated_at.toISOString()
                : updated_at || ''
            }${user?.updated_at}`,
        )
        .join();

  const memoizedThreadMessageData = threadMessages
    .map(
      ({ deleted_at, latest_reactions, pinned, status, updated_at, user }) =>
        `${deleted_at}${
          latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
        }${pinned}${status}${
          updated_at && (isDayOrMoment(updated_at) || isDate(updated_at))
            ? updated_at.toISOString()
            : updated_at || ''
        }${user?.updated_at}`,
    )
    .join();

  const channelStateContext: ChannelStateContextValue = useMemo(
    () => ({
      acceptedFiles,
      channel,
      channelCapabilities,
      channelConfig,
      channelUnreadUiState,
      dragAndDropWindow,
      error,
      giphyVersion,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      imageAttachmentSizeHandler,
      loading,
      loadingMore,
      maxNumberOfFiles,
      members,
      messageDraftsEnabled,
      messages,
      multipleUploads,
      mutes,
      notifications,
      pinnedMessages,
      read,
      shouldGenerateVideoThumbnail,
      suppressAutoscroll,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessages,
      videoAttachmentSizeHandler,
      watcher_count,
      watcherCount,
      watchers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channel.data?.name, // otherwise ChannelHeader will not be updated
      channelId,
      channelUnreadUiState,
      error,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      lastRead,
      loading,
      loadingMore,
      membersLength,
      memoizedMessageData,
      memoizedThreadMessageData,
      messageDraftsEnabled,
      notificationsLength,
      readUsersLength,
      readUsersLastReads,
      shouldGenerateVideoThumbnail,
      skipMessageDataMemoization,
      suppressAutoscroll,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessagesLength,
      watcherCount,
    ],
  );

  return channelStateContext;
};
