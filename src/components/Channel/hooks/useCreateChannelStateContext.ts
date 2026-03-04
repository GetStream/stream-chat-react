import { useMemo } from 'react';

import type { ChannelStateContextValue } from '../../../context/ChannelStateContext';

export const useCreateChannelStateContext = (value: ChannelStateContextValue) => {
  const {
    channel,
    // channelUnreadUiState,
    // error,
    // hasMore,
    // hasMoreNewer,
    // highlightedMessageId,
    // loading,
    // loadingMore,
    // messages = [],
    notifications,
    // pinnedMessages,
  } = value;
  const notificationsLength = notifications.length;

  // FIXME: this is crazy - I could not find out why the messages were not getting updated when only message properties that are not part
  // of this serialization has been changed. A great example of memoization gone wrong.
  // const memoizedMessageData = skipMessageDataMemoization
  //   ? messages
  //   : messages
  //       .map(
  //         ({
  //           deleted_at,
  //           latest_reactions,
  //           pinned,
  //           reply_count,
  //           status,
  //           type,
  //           updated_at,
  //           user,
  //         }) =>
  //           `${type}${deleted_at}${
  //             latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
  //           }${pinned}${reply_count}${status}${
  //             updated_at && (isDayOrMoment(updated_at) || isDate(updated_at))
  //               ? updated_at.toISOString()
  //               : updated_at || ''
  //           }${user?.updated_at}`,
  //       )
  //       .join();

  const channelStateContext: ChannelStateContextValue = useMemo(
    () => ({
      channel,
      // channelUnreadUiState,
      // error,
      // hasMore,
      // hasMoreNewer,
      // highlightedMessageId,
      // loading,
      // loadingMore,
      // messages,
      notifications,
      // pinnedMessages,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channel,
      // channelUnreadUiState,
      // error,
      // hasMore,
      // hasMoreNewer,
      // highlightedMessageId,
      // loading,
      // loadingMore,
      // memoizedMessageData,
      notificationsLength,
    ],
  );

  return channelStateContext;
};
