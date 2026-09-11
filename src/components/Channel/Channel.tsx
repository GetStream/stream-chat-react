import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { Event, Channel as StreamChannel } from 'stream-chat';

import { ChannelInstanceProvider, useChatContext } from '../../context';

import { CHANNEL_CONTAINER_ID } from './constants';
import {
  DEFAULT_HIGHLIGHT_DURATION,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
} from '../../constants/limits';

import {
  useChannelContainerClasses,
  useImageFlagEmojisOnWindowsClass,
} from './hooks/useChannelContainerClasses';
import { useSearchFocusedMessage } from '../Search/hooks';
import { WithAudioPlayback } from '../AudioPlayback';

export type ChannelProps = {
  /** Allows multiple audio players to play the audio at the same time. Disabled by default. */
  // todo: move WithAudioPlayback outside the Channel component
  allowConcurrentAudioPlayback?: boolean;
  /**
   * The channel to bind this subtree to. Required: a `Channel` without one has nothing to provide,
   * and deciding what to show when no channel is selected is the application's layout concern --
   * render `<ChannelPlaceholder />` (or nothing) instead of a channel-less `Channel`.
   */
  channel: StreamChannel;
};

/**
 * The channel's content column (`.str-chat__channel`) without any channel bound to it.
 *
 * Exported so an application can fill the same layout slot while no channel is selected -- the case
 * `Channel` used to cover with its `EmptyPlaceholder` prop, back when it accepted no channel.
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

// One component, not two. The split existed so the outer half could return early -- for a missing
// channel, and before that to apply a `key` -- before any hook ran. `channel` is required now and
// nothing is keyed, so there is nothing to return early for, and no reason for the hooks to live
// one level down. See specs/channel-instance-axis/spec.md.
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { allowConcurrentAudioPlayback, channel, children } = props;

  const { client, latestMessageDatesByChannels, searchController } = useChatContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();

  const jumpToMessageFromSearch = useSearchFocusedMessage();

  const online = useRef(true);

  const clearSearchFocusedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // todo: can we remove this big event handler and keep only relevant UI-only logic (e.g. 'connection.recovered')?
  const handleEvent = async (event: Event) => {
    // ignore the event if it is not targeted at the current channel.
    // Event targeted at this channel or globally targeted event should lead to state refresh
    if (event.type === 'user.messages.deleted' && event.cid && event.cid !== channel.cid)
      return;

    if (event.type === 'user.watching.start' || event.type === 'user.watching.stop')
      return;

    if (event.type === 'connection.changed' && typeof event.online === 'boolean') {
      online.current = event.online;
    }

    if (event.type === 'connection.recovered') {
      // Refresh the loaded message window ourselves. The client's reconnect hydration deliberately
      // skips re-seeding the message list of an `active` channel (we mark this one active while
      // mounted) because its 25-message page would perturb a larger scrolled-back window — it hands
      // that job to `channel.reload()`, which re-watches sized to the loaded window instead. Nothing
      // calls it for us, so without this the list stays stale after a reconnect and hard deletes that
      // happened while offline are never reconciled (they arrive via no event; only a re-query
      // surfaces them). This is deliberately the SDK's opinion about how the default component
      // behaves, not client-level policy.
      //
      // `recoverState` dispatches this only after re-querying the active channels, so the rest of the
      // channel state is already fresh by now.
      if (channel.pendingDisposal) return;
      try {
        await channel.reload();
      } catch (error) {
        // The socket can flap straight back down mid-reload. Keep the previously loaded window
        // rather than tearing the view down — the next recovery re-runs this.
        console.warn('Failed to reload the channel after connection recovery', error);
      }
      return;
    }

    if (event.type === 'message.new') {
      if (
        event.message?.user?.id === client.userID &&
        event?.message?.created_at &&
        event?.message?.cid
      ) {
        const messageCreatedAt = event.message.created_at;
        const cid = event.message.cid;

        if (
          !latestMessageDatesByChannels[cid] ||
          latestMessageDatesByChannels[cid] < messageCreatedAt
        ) {
          latestMessageDatesByChannels[cid] = messageCreatedAt;
        }
      }
    }

    if (event.type === 'user.deleted') {
      const oldestID = channel.messagePaginator.items?.[0]?.id;

      /**
       * As the channel state is not normalized we re-fetch the channel data. Thus, we avoid having to search for user references in the channel state.
       */
      // Re-fetching what is already loaded is maintenance of a bound channel, not initialization,
      // so it stays here -- but the page size is the SDK default now rather than the initial query
      // options, which `Channel` no longer takes.
      await channel.query({
        messages: { id_lt: oldestID, limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
        watchers: { limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
      });
    }
  };

  // Declare this channel as being consumed for as long as it is mounted. Refcounted in the client,
  // so several consumers holding the same Channel instance are handled. This is what gates the
  // client's no-destructive-reseed of an open channel's message list: channel-list hydration skips
  // re-seeding an active channel, leaving the fuller window `channel.reload()` owns intact.
  useEffect(() => {
    channel.activate();
    return () => {
      channel.deactivate();
    };
  }, [channel]);

  // Memoized on the instance, which is the axis that matters: consumers subscribe to *this*
  // channel's stores, so the value has to change when the instance does and not otherwise. It used
  // to be an inline object, which was harmless while a channel change rebuilt the subtree anyway.
  const channelInstanceContextValue = useMemo(() => ({ channel }), [channel]);

  useEffect(() => {
    // Re-derive the unread snapshot from the current read state on every (re)open. A cached
    // channel is NOT re-queried on reopen, so the LLC's first-page-query auto-seed does not run
    // and the separator/"N new" banner would otherwise show a stale boundary (or never clear).
    // Marking the channel read on open is owned by `useMarkRead` (only when the message list is
    // caught up at the bottom); this just seeds the boundary the separator/banner render from.
    //
    // Skip the re-seed when the channel is already flagged unread (`firstUnreadMessageId` set):
    // `seedUnreadSnapshot` clears that flag, so re-seeding would silently undo a deliberate
    // "mark as unread". A normally-read channel has no flag, so its boundary still refreshes.
    if (
      !channel.messagePaginator.unreadStateSnapshot.getLatestValue().firstUnreadMessageId
    ) {
      channel.messagePaginator.seedUnreadSnapshot();
    }

    // The more complex sync logic is done in Chat
    client.on('connection.changed', handleEvent);
    client.on('connection.recovered', handleEvent);
    client.on('user.updated', handleEvent);
    client.on('user.deleted', handleEvent);
    client.on('user.messages.deleted', handleEvent);
    channel.on(handleEvent);

    return () => {
      channel.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.deleted', handleEvent);
    };
    // `handleEvent` is deliberately excluded: it is re-created on every render, and this effect
    // must not re-run for it. `channel` is the instance, not its `cid` -- a new instance for the
    // same conversation has its own stores and its own subscription, and would otherwise never be
    // subscribed. See src/components/Channel/channelInstanceKey.ts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, client]);

  useEffect(() => {
    if (!jumpToMessageFromSearch?.id) return;
    void channel.messagePaginator.jumpToMessage(jumpToMessageFromSearch.id, {
      focusReason: 'jump-to-message',
      focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
    });

    if (clearSearchFocusedMessageTimeoutId.current) {
      clearTimeout(clearSearchFocusedMessageTimeoutId.current);
    }
    clearSearchFocusedMessageTimeoutId.current = setTimeout(() => {
      if (searchController._internalState.getLatestValue().focusedMessage) {
        searchController._internalState.partialNext({ focusedMessage: undefined });
      }
      clearSearchFocusedMessageTimeoutId.current = null;
    }, DEFAULT_HIGHLIGHT_DURATION);
  }, [
    channel.messagePaginator,
    jumpToMessageFromSearch,
    searchController._internalState,
  ]);

  return (
    <ChannelPlaceholder className={windowsEmojiClass}>
      <ChannelInstanceProvider value={channelInstanceContextValue}>
        {/* `.str-chat__channel` (rendered by ChannelContainer above) is itself the channel's
            main content column — a flex column that fills its parent. Children (header,
            message list, composer) render directly inside it; there is no separate
            `.str-chat__container` / `.str-chat__main-panel` wrapper anymore (the classic
            side-by-side Thread is a slot now, not a nested child). */}
        <WithAudioPlayback allowConcurrentPlayback={allowConcurrentAudioPlayback}>
          {children}
        </WithAudioPlayback>
      </ChannelInstanceProvider>
    </ChannelPlaceholder>
  );
};
