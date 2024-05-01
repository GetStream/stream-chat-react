import { useMemo } from 'react';

import { isDate, isDayOrMoment } from '../../../context/TranslationContext';

import type { ChannelStateContextValue } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChannelStateContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  value: Omit<ChannelStateContextValue<StreamChatGenerics>, 'channelCapabilities'> & {
    channelCapabilitiesArray: string[];
    skipMessageDataMemoization?: boolean;
  },
) => {
  const {
    acceptedFiles,
    channel,
    channelCapabilitiesArray = [],
    channelConfig,
    debounceURLEnrichmentMs,
    dragAndDropWindow,
    enrichURLForPreview,
    giphyVersion,
    error,
    findURLFn,
    hasMore,
    hasMoreNewer,
    imageAttachmentSizeHandler,
    suppressAutoscroll,
    highlightedMessageId,
    loading,
    loadingMore,
    maxNumberOfFiles,
    members,
    messages = [],
    multipleUploads,
    mutes,
    notifications,
    onLinkPreviewDismissed,
    pinnedMessages,
    quotedMessage,
    read = {},
    shouldGenerateVideoThumbnail,
    skipMessageDataMemoization,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages = [],
    channelUnreadUiState,
    videoAttachmentSizeHandler,
    watcherCount,
    watcher_count,
    watchers,
  } = value;

  const channelId = channel.cid;
  const lastRead = channel.initialized && channel.lastRead()?.getTime();
  const membersLength = Object.keys(members || []).length;
  const notificationsLength = notifications.length;
  const readUsers = Object.values(read);
  const readUsersLength = readUsers.length;
  const readUsersLastReads = readUsers.map(({ last_read }) => last_read.toISOString()).join();
  const threadMessagesLength = threadMessages?.length;

  const channelCapabilities: Record<string, boolean> = {};

  channelCapabilitiesArray.forEach((capability) => {
    channelCapabilities[capability] = true;
  });

  const memoizedMessageData = skipMessageDataMemoization
    ? messages
    : messages
        .map(
          ({ deleted_at, latest_reactions, pinned, reply_count, status, updated_at, user, poll }) =>
            `${deleted_at}${JSON.stringify(poll)}${
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

  const channelStateContext: ChannelStateContextValue<StreamChatGenerics> = useMemo(
    () => {
      console.log('re-rendering ChannelStateContext')
        channel.state.messages.forEach((message) => {
          if (message.id === "83d0a39b-68fa-4d51-9fac-da664cf805b1") {
            console.log('from channelStateContext memoization', message.poll.options);
          }
        })
      return {
      acceptedFiles,
      channel,
      channelCapabilities,
      channelConfig,
      channelUnreadUiState,
      debounceURLEnrichmentMs,
      dragAndDropWindow,
      enrichURLForPreview,
      error,
      findURLFn,
      giphyVersion,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      imageAttachmentSizeHandler,
      loading,
      loadingMore,
      maxNumberOfFiles,
      members,
      messages,
      multipleUploads,
      mutes,
      notifications,
      onLinkPreviewDismissed,
      pinnedMessages,
      quotedMessage,
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
    }},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelId,
      channelUnreadUiState,
      debounceURLEnrichmentMs,
      enrichURLForPreview,
      error,
      findURLFn,
      hasMore,
      hasMoreNewer,
      highlightedMessageId,
      lastRead,
      loading,
      loadingMore,
      membersLength,
      memoizedMessageData,
      memoizedThreadMessageData,
      notificationsLength,
      onLinkPreviewDismissed,
      quotedMessage,
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
