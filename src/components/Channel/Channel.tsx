import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  ChannelGetOrCreateRequest,
  ChannelMemberResponse,
  DeleteMessageOptions,
  Event,
  LocalMessage,
  MarkReadRequest,
  MessageRequest,
  MessageResponse,
  SendMessageOptions,
  Channel as StreamChannel,
  StreamChat,
  UpdateMessageOptions,
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
import { useChannelRequestHandlers } from './hooks/useChannelRequestHandlers';
import { getChannel } from '../../utils';
import { useSearchFocusedMessage } from '../Search/hooks';
import { WithAudioPlayback } from '../AudioPlayback';

export type ChannelProps = {
  /** Custom handler function that runs when the active channel has unread messages and the app is running on a separate browser tab */
  activeUnreadHandler?: (unread: number, documentTitle: string) => void;
  /** Allows multiple audio players to play the audio at the same time. Disabled by default. */
  allowConcurrentAudioPlayback?: boolean;
  /** The connected and active channel */
  channel?: StreamChannel;
  /**
   * Optional configuration parameters used for the initial channel query.
   * Applied only if the value of channel.initialized is false.
   * If the channel instance has already been initialized (channel has been queried),
   * then the channel query will be skipped and channelQueryOptions will not be applied.
   */
  channelQueryOptions?: ChannelGetOrCreateRequest;
  /** Custom action handler to override the default `client.deleteMessage(message.id)` function */
  doDeleteMessageRequest?: (
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel,
    options?: MarkReadRequest,
  ) => ReturnType<StreamChannel['markRead']> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function (advanced usage only) */
  doSendMessageRequest?: (
    channel: StreamChannel,
    message: MessageRequest,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function (advanced usage only) */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
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

/**
 * A wrapper component that provides channel data and renders children.
 * The Channel component provides the following contexts:
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 *
 * Not wrapped in `React.memo`: `Channel` always receives `children` (a fresh element every
 * parent render), so the default shallow comparison never matches and memo could never skip a
 * render. The heavy descendants (`MessageList`, etc.) memoize themselves.
 */
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { channel: propsChannel, EmptyPlaceholder = null } = props;
  // The channel is supplied via the `channel` prop (fed by a channel slot / the app's
  // slot-bound <Channel>). NOTE: master's giphyVersion/imageAttachmentSizeHandler/
  // videoAttachmentSizeHandler props + AttachmentContextProvider (custom attachment sizing)
  // are NOT provided by this PR-base Channel — useAttachmentContext falls back to defaults.
  // Re-graft the AttachmentContextProvider if custom sizing is needed.
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
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    initializeOnMount = true,
  } = props;

  const { LoadingErrorIndicator, LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext();

  const { client, latestMessageDatesByChannels, searchController } = useChatContext();
  const { t } = useTranslationContext();
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();

  const channelConfig = useChannelConfig({ cid: channel.cid });
  useChannelRequestHandlers({
    channel,
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
  });
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

    if (event.type === 'message.new') {
      const mainChannelUpdated =
        !event.message?.parent_id || event.message?.show_in_channel;

      if (mainChannelUpdated) {
        if (
          document.hidden &&
          channelConfig?.read_events &&
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
  }, [channel.cid, channelQueryOptions, channelConfig?.read_events, initializeOnMount]);

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
