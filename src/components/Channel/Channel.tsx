import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  ChannelGetOrCreateRequest,
  ChannelMemberResponse,
  Event,
  Channel as StreamChannel,
} from 'stream-chat';
import { useChannelConfig } from './hooks/useChannelConfig';

import { LoadingChannel as DefaultLoadingIndicator } from '../Loading';

import {
  ChannelInstanceProvider,
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';

import { CHANNEL_CONTAINER_ID } from './constants';
import {
  DEFAULT_HIGHLIGHT_DURATION,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
} from '../../constants/limits';

import {
  useChannelContainerClasses,
  useImageFlagEmojisOnWindowsClass,
} from './hooks/useChannelContainerClasses';
import { getChannel } from '../../utils';
import { useSearchFocusedMessage } from '../Search/hooks';
import { WithAudioPlayback } from '../AudioPlayback';

export type ChannelProps = {
  /** Custom handler function that runs when the active channel has unread messages and the app is running on a separate browser tab */
  // todo: remove from props
  activeUnreadHandler?: (unread: number, documentTitle: string) => void;
  /** Allows multiple audio players to play the audio at the same time. Disabled by default. */
  // todo: move WithAudioPlayback outside the Channel component
  allowConcurrentAudioPlayback?: boolean;
  /** The connected and active channel */
  channel?: StreamChannel;
  /**
   * Optional configuration parameters used for the initial channel query.
   * Applied only if the value of channel.initialized is false.
   * If the channel instance has already been initialized (channel has been queried),
   * then the channel query will be skipped and channelQueryOptions will not be applied.
   */
  // todo: remove from props
  channelQueryOptions?: ChannelGetOrCreateRequest;
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
  // todo: Channel should not be showing "no channel" content if the channel does not exist
  EmptyPlaceholder?: React.ReactElement | null;
  /**
   * Allows to prevent triggering the channel.watch() call when mounting the component.
   * That means that no channel data from the back-end will be received neither channel WS events will be delivered to the client.
   * Preventing to initialize the channel on mount allows us to postpone the channel creation to a later point in time.
   */
  initializeOnMount?: boolean;
};

const ChannelContainer = ({
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

export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { channel: propsChannel, EmptyPlaceholder = null } = props;
  const channel = propsChannel;

  if (!channel?.cid) {
    return <ChannelContainer>{EmptyPlaceholder}</ChannelContainer>;
  }

  return <ChannelInner {...props} channel={channel} key={channel.cid} />;
};

const ChannelInner = (
  props: PropsWithChildren<
    ChannelProps & {
      channel: StreamChannel;
      key: string;
    }
  >,
) => {
  const {
    activeUnreadHandler,
    allowConcurrentAudioPlayback,
    channel,
    channelQueryOptions,
    children,
    initializeOnMount = true,
  } = props;

  const { LoadingErrorIndicator, LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext();

  const { client, latestMessageDatesByChannels, searchController } = useChatContext();
  const { t } = useTranslationContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();

  const channelConfig = useChannelConfig({ channel, cid: channel.cid });
  const jumpToMessageFromSearch = useSearchFocusedMessage();

  const originalTitle = useRef('');
  const online = useRef(true);

  const clearSearchFocusedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [bootstrapError, setBootstrapError] = useState<Error | undefined>(undefined);
  const [isBootstrapping, setIsBootstrapping] = useState(
    !channel.initialized && initializeOnMount,
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
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;

      if (mainChannelUpdated) {
        if (
          document.hidden &&
          channelConfig?.readEvents.enabled &&
          !channel.muteStatus().muted
        ) {
          const unread = channel.countUnread();

          if (activeUnreadHandler) {
            activeUnreadHandler(unread, originalTitle.current);
          } else {
            document.title = `(${unread}) ${originalTitle.current}`;
          }
        }
      }

      if (
        event.message?.user?.id === client.userID &&
        event?.message?.created_at &&
        event?.message?.cid
      ) {
        const messageDate = new Date(event.message.created_at);
        const cid = event.message.cid;

        if (
          !latestMessageDatesByChannels[cid] ||
          latestMessageDatesByChannels[cid].getTime() < messageDate.getTime()
        ) {
          latestMessageDatesByChannels[cid] = messageDate;
        }
      }
    }

    if (event.type === 'user.deleted') {
      const oldestID = channel.messagePaginator.items?.[0]?.id;
      const refetchLimit =
        channelQueryOptions?.messages?.limit ?? DEFAULT_NEXT_CHANNEL_PAGE_SIZE;

      /**
       * As the channel state is not normalized we re-fetch the channel data. Thus, we avoid having to search for user references in the channel state.
       */
      await channel.query({
        ...channelQueryOptions,
        messages: {
          ...channelQueryOptions?.messages,
          id_lt: oldestID,
          limit: refetchLimit,
        },
        watchers: channelQueryOptions?.watchers ?? { limit: refetchLimit },
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

  // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release
  useLayoutEffect(() => {
    let errored = false;
    let done = false;
    let isMounted = true;

    (async () => {
      if (!channel.initialized && initializeOnMount) {
        if (isMounted) {
          setIsBootstrapping(true);
          setBootstrapError(undefined);
        }
        try {
          // if active channel has been set without id, we will create a temporary channel id from its member IDs
          // to keep track of the /query request in progress. This is the same approach of generating temporary id
          // that the JS client uses to keep track of channel in client.activeChannels
          const members: string[] = [];
          if (!channel.id && channel.data?.members) {
            for (const member of channel.data.members) {
              let userId: string | undefined;
              if (typeof member === 'string') {
                userId = member;
              } else if (typeof member === 'object') {
                const { user, user_id } = member as ChannelMemberResponse;
                userId = user_id || user?.id;
              }
              if (userId) {
                members.push(userId);
              }
            }
          }
          await getChannel({ channel, client, members, options: channelQueryOptions });
        } catch (e) {
          if (isMounted) {
            setBootstrapError(e as Error);
            setIsBootstrapping(false);
          }
          errored = true;
          return;
        }
      } else if (isMounted) {
        setBootstrapError(undefined);
        setIsBootstrapping(false);
      }

      done = true;
      if (isMounted) {
        setIsBootstrapping(false);
      }
      originalTitle.current = document.title;

      if (!errored) {
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
          !channel.messagePaginator.unreadStateSnapshot.getLatestValue()
            .firstUnreadMessageId
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
      }
    })();
    return () => {
      isMounted = false;
      if (errored || !done) return;
      channel?.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.deleted', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channel.cid,
    channelQueryOptions,
    channelConfig?.readEvents.enabled,
    initializeOnMount,
  ]);

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

  if (isBootstrapping && LoadingIndicator) {
    return (
      <ChannelContainer>
        <LoadingIndicator />
      </ChannelContainer>
    );
  }

  if (bootstrapError && LoadingErrorIndicator) {
    return (
      <ChannelContainer>
        <LoadingErrorIndicator error={bootstrapError} />
      </ChannelContainer>
    );
  }

  if (!channel.watch) {
    return (
      <ChannelContainer>
        <div>{t('channel.channelMissing.text', 'Channel Missing')}</div>
      </ChannelContainer>
    );
  }

  return (
    <ChannelContainer className={windowsEmojiClass}>
      <ChannelInstanceProvider value={{ channel }}>
        {/* `.str-chat__channel` (rendered by ChannelContainer above) is itself the channel's
            main content column — a flex column that fills its parent. Children (header,
            message list, composer) render directly inside it; there is no separate
            `.str-chat__container` / `.str-chat__main-panel` wrapper anymore (the classic
            side-by-side Thread is a slot now, not a nested child). */}
        <WithAudioPlayback allowConcurrentPlayback={allowConcurrentAudioPlayback}>
          {children}
        </WithAudioPlayback>
      </ChannelInstanceProvider>
    </ChannelContainer>
  );
};
