import type { ComponentProps, PropsWithChildren } from 'react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type {
  ChannelMemberResponse,
  ChannelQueryOptions,
  DeleteMessageOptions,
  Event,
  EventAPIResponse,
  LocalMessage,
  MarkReadOptions,
  Message,
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
  getChatContainerClass,
  useChannelContainerClasses,
  useImageFlagEmojisOnWindowsClass,
} from './hooks/useChannelContainerClasses';
import { useChannelRequestHandlers } from './hooks/useChannelRequestHandlers';
import { getChannel } from '../../utils';
import { useSearchFocusedMessage } from '../../experimental/Search/hooks';
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
  channelQueryOptions?: ChannelQueryOptions;
  /** Custom action handler to override the default `client.deleteMessage(message.id)` function */
  doDeleteMessageRequest?: (
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel,
    options?: MarkReadOptions,
  ) => Promise<EventAPIResponse | null> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function (advanced usage only) */
  doSendMessageRequest?: (
    channel: StreamChannel,
    message: Message,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function (advanced usage only) */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
  EmptyPlaceholder?: React.ReactElement;
  /**
   * Allows to prevent triggering the channel.watch() call when mounting the component.
   * That means that no channel data from the back-end will be received neither channel WS events will be delivered to the client.
   * Preventing to initialize the channel on mount allows us to postpone the channel creation to a later point in time.
   */
  initializeOnMount?: boolean;
  /** Configuration parameter to mark the active channel as read when mounted (opened). By default, the channel is marked read on mount. */
  markReadOnMount?: boolean;
};

const ChannelContainer = ({
  children,
  className: additionalClassName,
  ...props
}: PropsWithChildren<ComponentProps<'div'>>) => {
  const { customClasses, theme } = useChatContext('Channel');
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

const UnMemoizedChannel = (props: PropsWithChildren<ChannelProps>) => {
  const { channel: propsChannel, EmptyPlaceholder = null } = props;
  const { LoadingErrorIndicator, LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext();

  const { channelsQueryState } = useChatContext('Channel');
  const channel = propsChannel;

  if (channelsQueryState.queryInProgress === 'reload' && LoadingIndicator) {
    return (
      <ChannelContainer>
        <LoadingIndicator />
      </ChannelContainer>
    );
  }

  if (channelsQueryState.error && LoadingErrorIndicator) {
    return (
      <ChannelContainer>
        <LoadingErrorIndicator error={channelsQueryState.error} />
      </ChannelContainer>
    );
  }

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
    markReadOnMount = true,
  } = props;

  const { LoadingErrorIndicator, LoadingIndicator = DefaultLoadingIndicator } =
    useComponentContext();

  const { client, customClasses, latestMessageDatesByChannels, searchController } =
    useChatContext('Channel');
  const { t } = useTranslationContext('Channel');
  const chatContainerClass = getChatContainerClass(customClasses?.chatContainer);
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
  const lastRead = useRef<Date | undefined>(undefined);
  const online = useRef(true);

  const clearSearchFocusedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [bootstrapError, setBootstrapError] = useState<Error | undefined>(undefined);
  const [isBootstrapping, setIsBootstrapping] = useState(
    !channel.initialized && initializeOnMount,
  );

  const markChannelRead = useCallback(
    async ({
      updateChannelUiUnreadState = true,
    }: { updateChannelUiUnreadState?: boolean } = {}) => {
      if (channel.disconnected || !channelConfig?.read_events) {
        return;
      }

      lastRead.current = new Date();

      try {
        const markReadResponse = await channel.markRead();
        // markReadResponse.event can be null for users not members of the channel
        if (updateChannelUiUnreadState && markReadResponse?.event) {
          channel.messagePaginator.unreadStateSnapshot.next({
            firstUnreadMessageId: null,
            lastReadAt: lastRead.current,
            lastReadMessageId: markReadResponse.event.last_read_message_id ?? null,
            unreadCount: 0,
          });
        }

        if (activeUnreadHandler) {
          activeUnreadHandler(0, originalTitle.current);
        } else if (originalTitle.current) {
          document.title = originalTitle.current;
        }
      } catch (e) {
        console.error(t('Failed to mark channel as read'));
      }
    },
    [activeUnreadHandler, channel, channelConfig?.read_events, t],
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
          const unread = channel.countUnread(lastRead.current);

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
      const oldestID = channel.state?.messages?.[0]?.id;
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
        const ownReadState = client.userID ? channel.state.read[client.userID] : undefined;
        const lastReadAtFromOwnReadState = ownReadState?.last_read
          ? new Date(ownReadState.last_read)
          : undefined;

        if (channel.countUnread(lastReadAtFromOwnReadState) > 0 && markReadOnMount)
          void markChannelRead({ updateChannelUiUnreadState: false });
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
    channelConfig?.read_events,
    initializeOnMount,
    markChannelRead,
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
        <div>{t('Channel Missing')}</div>
      </ChannelContainer>
    );
  }

  return (
    <ChannelContainer className={windowsEmojiClass}>
      <ChannelInstanceProvider value={{ channel }}>
        <WithAudioPlayback allowConcurrentPlayback={allowConcurrentAudioPlayback}>
          <div className={clsx(chatContainerClass)}>{children}</div>
        </WithAudioPlayback>
      </ChannelInstanceProvider>
    </ChannelContainer>
  );
};

/**
 * A wrapper component that provides channel data and renders children.
 * The Channel component provides the following contexts:
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const Channel = React.memo(UnMemoizedChannel) as typeof UnMemoizedChannel;
