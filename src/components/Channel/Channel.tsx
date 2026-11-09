import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import type { Channel as StreamChannel } from 'stream-chat';

import { ChannelInstanceProvider, useChatContext } from '../../context';

import { CHANNEL_CONTAINER_ID } from './constants';
import { DEFAULT_NEXT_CHANNEL_PAGE_SIZE } from '../../constants/limits';

import {
  useChannelContainerClasses,
  useImageFlagEmojisOnWindowsClass,
} from './hooks/useChannelContainerClasses';
import { WithAudioPlayback } from '../AudioPlayback';

export type ChannelProps = {
  /**
   * Channel to bind to this subtree, initialized beforehand: `Channel` does not query. Render
   * `<ChannelPlaceholder />` while none is selected.
   */
  channel: StreamChannel;
};

/**
 * The channel content column (`.str-chat__channel`) with no channel bound, to fill the layout slot
 * while none is selected. `Channel` renders it as its container.
 */
export const ChannelPlaceholder = ({
  children,
  className: additionalClassName,
  ...props
}: PropsWithChildren<ComponentProps<'div'>>) => {
  const { customClasses, theme } = useChatContext();
  const { channelClass, chatClass } = useChannelContainerClasses({
    customClasses,
  });
  const className = clsx(chatClass, theme, channelClass, additionalClassName);
  return (
    <div id={CHANNEL_CONTAINER_ID} {...props} className={className}>
      {children}
    </div>
  );
};

/** Binds `channel` to its subtree and keeps it active while mounted, without querying it. */
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { channel, children } = props;

  const { client } = useChatContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();

  // An active channel stays in the client's channel store, and channel-list hydration does not
  // re-seed its message list (`channel.reload()` owns that window). Claims are refcounted; the
  // returned function ends only this mount's claim.
  useEffect(() => channel.activate(), [channel]);

  // Depends on the instance, not the `cid`: children subscribe to this channel's stores.
  const channelInstanceContextValue = useMemo(() => ({ channel }), [channel]);

  useEffect(() => {
    // Re-seeds the unread boundary behind the separator and "N new" banner: a cached channel is not
    // re-queried on reopen, so the LLC's auto-seed does not run. Skipped when the channel is marked
    // unread, because seeding clears that mark. Marking read is left to `useMarkRead`.
    if (
      !channel.messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId
    ) {
      channel.messagePaginator.seedUnreadSnapshot();
    }

    // Each subscription is released by its own handle, so subscribing and unsubscribing stay
    // paired.
    const subscriptions = [
      // Channel state is not normalized, so references to the deleted user are refreshed by a
      // re-query. It updates members, read state and watchers, but not the loaded messages: the
      // requested page is older than the loaded window.
      // todo: remove with REACT-1175 (single source of truth for user references)
      client.on('user.deleted', async () => {
        const oldestID = channel.messagePaginator.items?.[0]?.id;

        await channel.query({
          messages: { id_lt: oldestID, limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
          watchers: { limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
        });
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [channel, client]);

  return (
    <ChannelPlaceholder className={windowsEmojiClass}>
      <ChannelInstanceProvider value={channelInstanceContextValue}>
        <WithAudioPlayback playbackScope={channel}>{children}</WithAudioPlayback>
      </ChannelInstanceProvider>
    </ChannelPlaceholder>
  );
};
