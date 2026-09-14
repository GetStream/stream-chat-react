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
   * The channel to bind this subtree to. Required -- render `<ChannelPlaceholder />` (or nothing)
   * while none is selected. Initialize it before passing it in; `Channel` does not query.
   */
  channel: StreamChannel;
};

/**
 * The channel's content column (`.str-chat__channel`) with no channel bound, for filling the same
 * layout slot while none is selected.
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

// One component: `channel` is required and nothing is keyed, so there is no early return needing a
// wrapper to sit in front of the hooks.
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { channel, children } = props;

  const { client } = useChatContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();

  // Claim the channel while mounted (refcounted, so several consumers are fine). The client skips
  // re-seeding an active channel's message list on hydration, leaving the larger loaded window to
  // `channel.reload()`.
  useEffect(() => {
    channel.activate();
    return () => {
      channel.deactivate();
    };
  }, [channel]);

  // Keyed on the instance, not the cid: children subscribe to *this* channel's stores.
  const channelInstanceContextValue = useMemo(() => ({ channel }), [channel]);

  useEffect(() => {
    // Re-seed the unread boundary the separator and "N new" banner render from: a cached channel
    // is not re-queried on reopen, so the LLC's auto-seed never runs and the boundary would be
    // stale. Skipped when the channel is deliberately flagged unread, since seeding clears that
    // flag. Marking read is `useMarkRead`'s job, not this one's.
    if (
      !channel.messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId
    ) {
      channel.messagePaginator.seedUnreadSnapshot();
    }

    // One subscription per event, each released by its own handle, so subscribing and
    // unsubscribing cannot drift apart and nothing has to filter events it never asked for.
    const subscriptions = [
      // Reconnect hydration skips an active channel's message list -- a 25-message page would
      // perturb a scrolled-back window -- and leaves it to `channel.reload()`, which re-watches
      // sized to the loaded window. Nothing else calls it, so without this the list stays stale
      // and offline hard deletes are never reconciled: they arrive via no event.
      client.on('connection.recovered', async () => {
        if (channel.pendingDisposal) return;
        try {
          await channel.reload();
        } catch (error) {
          // The socket can drop again mid-reload. Keep the loaded window; the next recovery retries.
          console.warn('Failed to reload the channel after connection recovery', error);
        }
      }),

      // Channel state is not normalized, so rather than hunting this user's references through it
      // we re-query. Note what that does and does not do: it refreshes members, read state and
      // watchers, but not the loaded messages -- the page it asks for is older than the window.
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
