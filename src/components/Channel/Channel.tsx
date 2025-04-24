import type { ComponentProps, PropsWithChildren } from 'react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import throttle from 'lodash.throttle';
import { localMessageToNewMessagePayload } from 'stream-chat';
import type {
  APIErrorResponse,
  ChannelAPIResponse,
  ChannelMemberResponse,
  ChannelQueryOptions,
  ChannelState,
  ErrorFromResponse,
  Event,
  EventAPIResponse,
  LocalMessage,
  Message,
  MessageResponse,
  SendMessageAPIResponse,
  SendMessageOptions,
  Channel as StreamChannel,
  StreamChat,
  UpdateMessageOptions,
} from 'stream-chat';

import { initialState, makeChannelReducer } from './channelState';
import { useCreateChannelStateContext } from './hooks/useCreateChannelStateContext';
import { useCreateTypingContext } from './hooks/useCreateTypingContext';
import { useEditMessageHandler } from './hooks/useEditMessageHandler';
import { useIsMounted } from './hooks/useIsMounted';
import type { OnMentionAction } from './hooks/useMentionsHandlers';
import { useMentionsHandlers } from './hooks/useMentionsHandlers';

import type { LoadingErrorIndicatorProps } from '../Loading';
import { LoadingErrorIndicator as DefaultLoadingErrorIndicator } from '../Loading';
import { LoadingChannel as DefaultLoadingIndicator } from './LoadingChannel';

import type {
  ChannelActionContextValue,
  ChannelNotifications,
  ComponentContextValue,
  MarkReadWrapperOptions,
} from '../../context';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  TypingProvider,
  useChatContext,
  useTranslationContext,
  WithComponents,
} from '../../context';

import { CHANNEL_CONTAINER_ID } from './constants';
import {
  DEFAULT_HIGHLIGHT_DURATION,
  DEFAULT_INITIAL_CHANNEL_PAGE_SIZE,
  DEFAULT_JUMP_TO_PAGE_SIZE,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
  DEFAULT_THREAD_PAGE_SIZE,
} from '../../constants/limits';

import { hasMoreMessagesProbably } from '../MessageList';
import {
  getChatContainerClass,
  useChannelContainerClasses,
  useImageFlagEmojisOnWindowsClass,
} from './hooks/useChannelContainerClasses';
import { findInMsgSetByDate, findInMsgSetById, makeAddNotifications } from './utils';
import { useThreadContext } from '../Threads';
import { getChannel } from '../../utils';

import type { MessageInputProps } from '../MessageInput';
import type {
  ChannelUnreadUiState,
  GiphyVersions,
  ImageAttachmentSizeHandler,
  VideoAttachmentSizeHandler,
} from '../../types/types';
import {
  getImageAttachmentConfiguration,
  getVideoAttachmentConfiguration,
} from '../Attachment/attachment-sizing';
import { useSearchFocusedMessage } from '../../experimental/Search/hooks';

type ChannelPropsForwardedToComponentContext = Pick<
  ComponentContextValue,
  | 'Attachment'
  | 'AttachmentPreviewList'
  | 'AttachmentSelector'
  | 'AttachmentSelectorInitiationButtonContents'
  | 'AudioRecorder'
  | 'AutocompleteSuggestionItem'
  | 'AutocompleteSuggestionList'
  | 'Avatar'
  | 'BaseImage'
  | 'CooldownTimer'
  | 'CustomMessageActionsList'
  | 'DateSeparator'
  | 'EditMessageInput'
  | 'EmojiPicker'
  | 'emojiSearchIndex'
  | 'EmptyStateIndicator'
  | 'FileUploadIcon'
  | 'GiphyPreviewMessage'
  | 'HeaderComponent'
  | 'Input'
  | 'LinkPreviewList'
  | 'LoadingIndicator'
  | 'Message'
  | 'MessageActions'
  | 'MessageBouncePrompt'
  | 'MessageBlocked'
  | 'MessageDeleted'
  | 'MessageListNotifications'
  | 'MessageListMainPanel'
  | 'MessageNotification'
  | 'MessageOptions'
  | 'MessageRepliesCountButton'
  | 'MessageStatus'
  | 'MessageSystem'
  | 'MessageTimestamp'
  | 'ModalGallery'
  | 'PinIndicator'
  | 'PollActions'
  | 'PollContent'
  | 'PollCreationDialog'
  | 'PollHeader'
  | 'PollOptionSelector'
  | 'QuotedMessage'
  | 'QuotedMessagePreview'
  | 'QuotedPoll'
  | 'reactionOptions'
  | 'ReactionSelector'
  | 'ReactionsList'
  | 'ReactionsListModal'
  | 'SendButton'
  | 'StartRecordingAudioButton'
  | 'ThreadHead'
  | 'ThreadHeader'
  | 'ThreadStart'
  | 'Timestamp'
  | 'TypingIndicator'
  | 'UnreadMessagesNotification'
  | 'UnreadMessagesSeparator'
  | 'VirtualMessage'
  | 'StopAIGenerationButton'
  | 'StreamedMessageText'
>;

export type ChannelProps = ChannelPropsForwardedToComponentContext & {
  // todo: X document the use of config.attachments.fileUploadFilter to replace acceptedFiles prop
  /** List of accepted file types */
  acceptedFiles?: string[];
  /** Custom handler function that runs when the active channel has unread messages and the app is running on a separate browser tab */
  activeUnreadHandler?: (unread: number, documentTitle: string) => void;
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
  doDeleteMessageRequest?: (message: LocalMessage) => Promise<MessageResponse>;
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel,
    setChannelUnreadUiState?: (state: ChannelUnreadUiState) => void,
  ) => Promise<EventAPIResponse> | void;
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
  /** The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default */
  giphyVersion?: GiphyVersions;
  /** A custom function to provide size configuration for image attachments */
  imageAttachmentSizeHandler?: ImageAttachmentSizeHandler;
  /**
   * Allows to prevent triggering the channel.watch() call when mounting the component.
   * That means that no channel data from the back-end will be received neither channel WS events will be delivered to the client.
   * Preventing to initialize the channel on mount allows us to postpone the channel creation to a later point in time.
   */
  initializeOnMount?: boolean;
  /** Custom UI component to be shown if the channel query fails, defaults to and accepts same props as: [LoadingErrorIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingErrorIndicator.tsx) */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Configuration parameter to mark the active channel as read when mounted (opened). By default, the channel is marked read on mount. */
  markReadOnMount?: boolean;
  // todo: X document how maxNumberOfFiles can be customized with message composer
  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles?: number;
  // todo: X document that multipleUploads is redundant and ignored with message composer
  /** Whether to allow multiple attachment uploads */
  multipleUploads?: boolean;
  /** Custom action handler function to run on click of an @mention in a message */
  onMentionsClick?: OnMentionAction;
  /** Custom action handler function to run on hover of an @mention in a message */
  onMentionsHover?: OnMentionAction;
  /** You can turn on/off thumbnail generation for video attachments */
  shouldGenerateVideoThumbnail?: boolean;
  /** If true, skips the message data string comparison used to memoize the current channel messages (helpful for channels with 1000s of messages) */
  skipMessageDataMemoization?: boolean;
  /** A custom function to provide size configuration for video attachments */
  videoAttachmentSizeHandler?: VideoAttachmentSizeHandler;
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
  const {
    channel: propsChannel,
    EmptyPlaceholder = null,
    LoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
  } = props;

  const { channel: contextChannel, channelsQueryState } = useChatContext('Channel');

  const channel = propsChannel || contextChannel;

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
    acceptedFiles,
    activeUnreadHandler,
    channel,
    channelQueryOptions: propChannelQueryOptions,
    children,
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    initializeOnMount = true,
    LoadingErrorIndicator = DefaultLoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    markReadOnMount = true,
    maxNumberOfFiles,
    multipleUploads = true,
    onMentionsClick,
    onMentionsHover,
    skipMessageDataMemoization,
  } = props;

  const channelQueryOptions: ChannelQueryOptions & {
    messages: { limit: number };
  } = useMemo(
    () =>
      defaultsDeep(propChannelQueryOptions, {
        messages: { limit: DEFAULT_INITIAL_CHANNEL_PAGE_SIZE },
      }),
    [propChannelQueryOptions],
  );

  const { client, customClasses, latestMessageDatesByChannels, mutes, searchController } =
    useChatContext('Channel');
  const { t } = useTranslationContext('Channel');
  const chatContainerClass = getChatContainerClass(customClasses?.chatContainer);
  const windowsEmojiClass = useImageFlagEmojisOnWindowsClass();
  const thread = useThreadContext();

  const [channelConfig, setChannelConfig] = useState(channel.getConfig());
  // FIXME: Create a proper notification service in the LLC.
  const [notifications, setNotifications] = useState<ChannelNotifications>([]);
  const notificationTimeouts = useRef<Array<NodeJS.Timeout>>([]);

  const [channelUnreadUiState, _setChannelUnreadUiState] =
    useState<ChannelUnreadUiState>();

  const channelReducer = useMemo(() => makeChannelReducer(), []);

  const [state, dispatch] = useReducer(
    channelReducer,
    // channel.initialized === false if client.channel().query() was not called, e.g. ChannelList is not used
    // => Channel will call channel.watch() in useLayoutEffect => state.loading is used to signal the watch() call state
    {
      ...initialState,
      hasMore: channel.state.messagePagination.hasPrev,
      loading: !channel.initialized,
    },
  );
  const jumpToMessageFromSearch = useSearchFocusedMessage();
  const isMounted = useIsMounted();

  const originalTitle = useRef('');
  const lastRead = useRef<Date | undefined>(undefined);
  const online = useRef(true);

  const clearHighlightedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const channelCapabilitiesArray = channel.data?.own_capabilities as string[];

  const throttledCopyStateFromChannel = throttle(
    () => dispatch({ channel, type: 'copyStateFromChannelOnEvent' }),
    500,
    {
      leading: true,
      trailing: true,
    },
  );

  const setChannelUnreadUiState = useMemo(
    () =>
      throttle(_setChannelUnreadUiState, 200, {
        leading: true,
        trailing: false,
      }),
    [],
  );

  const markRead = useMemo(
    () =>
      throttle(
        async (options?: MarkReadWrapperOptions) => {
          const { updateChannelUiUnreadState = true } = options ?? {};
          if (channel.disconnected || !channelConfig?.read_events) {
            return;
          }

          lastRead.current = new Date();

          try {
            if (doMarkReadRequest) {
              doMarkReadRequest(
                channel,
                updateChannelUiUnreadState ? setChannelUnreadUiState : undefined,
              );
            } else {
              const markReadResponse = await channel.markRead();
              if (updateChannelUiUnreadState && markReadResponse) {
                _setChannelUnreadUiState({
                  last_read: lastRead.current,
                  last_read_message_id: markReadResponse.event.last_read_message_id,
                  unread_messages: 0,
                });
              }
            }

            if (activeUnreadHandler) {
              activeUnreadHandler(0, originalTitle.current);
            } else if (originalTitle.current) {
              document.title = originalTitle.current;
            }
          } catch (e) {
            console.error(t<string>('Failed to mark channel as read'));
          }
        },
        500,
        { leading: true, trailing: false },
      ),
    [
      activeUnreadHandler,
      channel,
      channelConfig,
      doMarkReadRequest,
      setChannelUnreadUiState,
      t,
    ],
  );

  const handleEvent = async (event: Event) => {
    if (event.message) {
      dispatch({
        channel,
        message: event.message,
        type: 'updateThreadOnEvent',
      });
    }

    if (event.type === 'user.watching.start' || event.type === 'user.watching.stop')
      return;

    if (event.type === 'typing.start' || event.type === 'typing.stop') {
      return dispatch({ channel, type: 'setTyping' });
    }

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

      /**
       * As the channel state is not normalized we re-fetch the channel data. Thus, we avoid having to search for user references in the channel state.
       */
      // FIXME: we should use channelQueryOptions if they are available
      await channel.query({
        messages: { id_lt: oldestID, limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
        watchers: { limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
      });
    }

    if (event.type === 'notification.mark_unread')
      _setChannelUnreadUiState((prev) => {
        if (!(event.last_read_at && event.user)) return prev;
        return {
          first_unread_message_id: event.first_unread_message_id,
          last_read: new Date(event.last_read_at),
          last_read_message_id: event.last_read_message_id,
          unread_messages: event.unread_messages ?? 0,
        };
      });

    if (event.type === 'channel.truncated' && event.cid === channel.cid) {
      _setChannelUnreadUiState(undefined);
    }

    throttledCopyStateFromChannel();
  };

  // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release
  useLayoutEffect(() => {
    let errored = false;
    let done = false;

    (async () => {
      if (!channel.initialized && initializeOnMount) {
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
          const config = channel.getConfig();
          setChannelConfig(config);
        } catch (e) {
          dispatch({ error: e as Error, type: 'setError' });
          errored = true;
        }
      }

      if (maxNumberOfFiles) {
        // todo: X this has to be configured via a template
        channel.messageComposer.attachmentManager.config.maxNumberOfFilesPerMessage =
          maxNumberOfFiles;
      }
      done = true;
      originalTitle.current = document.title;

      if (!errored) {
        dispatch({
          channel,
          hasMore: channel.state.messagePagination.hasPrev,
          type: 'initStateFromChannel',
        });

        if (client.user?.id && channel.state.read[client.user.id]) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { user, ...ownReadState } = channel.state.read[client.user.id];
          _setChannelUnreadUiState(ownReadState);
        }
        /**
         * TODO: maybe pass last_read to the countUnread method to get proper value
         * combined with channel.countUnread adjustment (_countMessageAsUnread)
         * to allow counting own messages too
         *
         * const lastRead = channel.state.read[client.userID as string].last_read;
         */
        if (channel.countUnread() > 0 && markReadOnMount)
          markRead({ updateChannelUiUnreadState: false });
        // The more complex sync logic is done in Chat
        client.on('connection.changed', handleEvent);
        client.on('connection.recovered', handleEvent);
        client.on('user.updated', handleEvent);
        client.on('user.deleted', handleEvent);
        channel.on(handleEvent);
      }
    })();
    const notificationTimeoutsRef = notificationTimeouts.current;

    return () => {
      if (errored || !done) return;
      channel?.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.deleted', handleEvent);
      notificationTimeoutsRef.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    channel.cid,
    channelQueryOptions,
    doMarkReadRequest,
    channelConfig?.read_events,
    initializeOnMount,
  ]);

  useEffect(() => {
    if (!state.thread) return;

    const message = state.messages?.find((m) => m.id === state.thread?.id);

    if (message) dispatch({ message, type: 'setThread' });
  }, [state.messages, state.thread]);

  const handleHighlightedMessageChange = useCallback(
    ({
      highlightDuration,
      highlightedMessageId,
    }: {
      highlightedMessageId: string;
      highlightDuration?: number;
    }) => {
      dispatch({
        channel,
        highlightedMessageId,
        type: 'jumpToMessageFinished',
      });
      if (clearHighlightedMessageTimeoutId.current) {
        clearTimeout(clearHighlightedMessageTimeoutId.current);
      }
      clearHighlightedMessageTimeoutId.current = setTimeout(() => {
        if (searchController._internalState.getLatestValue().focusedMessage) {
          searchController._internalState.partialNext({ focusedMessage: undefined });
        }
        clearHighlightedMessageTimeoutId.current = null;
        dispatch({ type: 'clearHighlightedMessage' });
      }, highlightDuration ?? DEFAULT_HIGHLIGHT_DURATION);
    },
    [channel, searchController],
  );

  useEffect(() => {
    if (!jumpToMessageFromSearch?.id) return;
    handleHighlightedMessageChange({ highlightedMessageId: jumpToMessageFromSearch.id });
  }, [jumpToMessageFromSearch, handleHighlightedMessageChange]);

  /** MESSAGE */

  // Adds a temporary notification to message list, will be removed after 5 seconds
  const addNotification = useMemo(
    () => makeAddNotifications(setNotifications, notificationTimeouts.current),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMoreFinished = useCallback(
    debounce(
      (hasMore: boolean, messages: ChannelState['messages']) => {
        if (!isMounted.current) return;
        dispatch({ hasMore, messages, type: 'loadMoreFinished' });
      },
      2000,
      { leading: true, trailing: true },
    ),
    [],
  );

  const loadMore = async (limit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE) => {
    if (
      !online.current ||
      !window.navigator.onLine ||
      !channel.state.messagePagination.hasPrev
    )
      return 0;

    // prevent duplicate loading events...
    const oldestMessage = state?.messages?.[0];

    if (
      state.loadingMore ||
      state.loadingMoreNewer ||
      oldestMessage?.status !== 'received'
    ) {
      return 0;
    }

    dispatch({ loadingMore: true, type: 'setLoadingMore' });

    const oldestID = oldestMessage?.id;
    const perPage = limit;
    let queryResponse: ChannelAPIResponse;

    try {
      queryResponse = await channel.query({
        messages: { id_lt: oldestID, limit: perPage },
        watchers: { limit: perPage },
      });
    } catch (e) {
      console.warn('message pagination request failed with error', e);
      dispatch({ loadingMore: false, type: 'setLoadingMore' });
      return 0;
    }

    loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);

    return queryResponse.messages.length;
  };

  const loadMoreNewer = async (limit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE) => {
    if (
      !online.current ||
      !window.navigator.onLine ||
      !channel.state.messagePagination.hasNext
    )
      return 0;

    const newestMessage = state?.messages?.[state?.messages?.length - 1];
    if (state.loadingMore || state.loadingMoreNewer) return 0;

    dispatch({ loadingMoreNewer: true, type: 'setLoadingMoreNewer' });

    const newestId = newestMessage?.id;
    const perPage = limit;
    let queryResponse: ChannelAPIResponse;

    try {
      queryResponse = await channel.query({
        messages: { id_gt: newestId, limit: perPage },
        watchers: { limit: perPage },
      });
    } catch (e) {
      console.warn('message pagination request failed with error', e);
      dispatch({ loadingMoreNewer: false, type: 'setLoadingMoreNewer' });
      return 0;
    }

    dispatch({
      hasMoreNewer: channel.state.messagePagination.hasNext,
      messages: channel.state.messages,
      type: 'loadMoreNewerFinished',
    });
    return queryResponse.messages.length;
  };

  const jumpToMessage: ChannelActionContextValue['jumpToMessage'] = useCallback(
    async (
      messageId,
      messageLimit = DEFAULT_JUMP_TO_PAGE_SIZE,
      highlightDuration = DEFAULT_HIGHLIGHT_DURATION,
    ) => {
      dispatch({ loadingMore: true, type: 'setLoadingMore' });
      await channel.state.loadMessageIntoState(messageId, undefined, messageLimit);

      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      handleHighlightedMessageChange({
        highlightDuration,
        highlightedMessageId: messageId,
      });
    },
    [channel, handleHighlightedMessageChange, loadMoreFinished],
  );

  const jumpToLatestMessage: ChannelActionContextValue['jumpToLatestMessage'] =
    useCallback(async () => {
      await channel.state.loadMessageIntoState('latest');
      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      dispatch({
        type: 'jumpToLatestMessage',
      });
    }, [channel, loadMoreFinished]);

  const jumpToFirstUnreadMessage: ChannelActionContextValue['jumpToFirstUnreadMessage'] =
    useCallback(
      async (
        queryMessageLimit = DEFAULT_JUMP_TO_PAGE_SIZE,
        highlightDuration = DEFAULT_HIGHLIGHT_DURATION,
      ) => {
        if (!channelUnreadUiState?.unread_messages) return;
        let lastReadMessageId = channelUnreadUiState?.last_read_message_id;
        let firstUnreadMessageId = channelUnreadUiState?.first_unread_message_id;
        let isInCurrentMessageSet = false;

        if (firstUnreadMessageId) {
          const result = findInMsgSetById(firstUnreadMessageId, channel.state.messages);
          isInCurrentMessageSet = result.index !== -1;
        } else if (lastReadMessageId) {
          const result = findInMsgSetById(lastReadMessageId, channel.state.messages);
          isInCurrentMessageSet = !!result.target;
          firstUnreadMessageId =
            result.index > -1 ? channel.state.messages[result.index + 1]?.id : undefined;
        } else {
          const lastReadTimestamp = channelUnreadUiState.last_read.getTime();
          const { index: lastReadMessageIndex, target: lastReadMessage } =
            findInMsgSetByDate(
              channelUnreadUiState.last_read,
              channel.state.messages,
              true,
            );

          if (lastReadMessage) {
            firstUnreadMessageId = channel.state.messages[lastReadMessageIndex + 1]?.id;
            isInCurrentMessageSet = !!firstUnreadMessageId;
            lastReadMessageId = lastReadMessage.id;
          } else {
            dispatch({ loadingMore: true, type: 'setLoadingMore' });
            let messages;
            try {
              messages = (
                await channel.query(
                  {
                    messages: {
                      created_at_around: channelUnreadUiState.last_read.toISOString(),
                      limit: queryMessageLimit,
                    },
                  },
                  'new',
                )
              ).messages;
            } catch (e) {
              addNotification(t('Failed to jump to the first unread message'), 'error');
              loadMoreFinished(
                channel.state.messagePagination.hasPrev,
                channel.state.messages,
              );
              return;
            }

            const firstMessageWithCreationDate = messages.find((msg) => msg.created_at);
            if (!firstMessageWithCreationDate) {
              addNotification(t('Failed to jump to the first unread message'), 'error');
              loadMoreFinished(
                channel.state.messagePagination.hasPrev,
                channel.state.messages,
              );
              return;
            }
            const firstMessageTimestamp = new Date(
              firstMessageWithCreationDate.created_at as string,
            ).getTime();
            if (lastReadTimestamp < firstMessageTimestamp) {
              // whole channel is unread
              firstUnreadMessageId = firstMessageWithCreationDate.id;
            } else {
              const result = findInMsgSetByDate(channelUnreadUiState.last_read, messages);
              lastReadMessageId = result.target?.id;
            }
            loadMoreFinished(
              channel.state.messagePagination.hasPrev,
              channel.state.messages,
            );
          }
        }

        if (!firstUnreadMessageId && !lastReadMessageId) {
          addNotification(t('Failed to jump to the first unread message'), 'error');
          return;
        }

        if (!isInCurrentMessageSet) {
          dispatch({ loadingMore: true, type: 'setLoadingMore' });
          try {
            const targetId = (firstUnreadMessageId ?? lastReadMessageId) as string;
            await channel.state.loadMessageIntoState(
              targetId,
              undefined,
              queryMessageLimit,
            );
            /**
             * if the index of the last read message on the page is beyond the half of the page,
             * we have arrived to the oldest page of the channel
             */
            const indexOfTarget = channel.state.messages.findIndex(
              (message) => message.id === targetId,
            ) as number;
            loadMoreFinished(
              channel.state.messagePagination.hasPrev,
              channel.state.messages,
            );
            firstUnreadMessageId =
              firstUnreadMessageId ?? channel.state.messages[indexOfTarget + 1]?.id;
          } catch (e) {
            addNotification(t('Failed to jump to the first unread message'), 'error');
            loadMoreFinished(
              channel.state.messagePagination.hasPrev,
              channel.state.messages,
            );
            return;
          }
        }

        if (!firstUnreadMessageId) {
          addNotification(t('Failed to jump to the first unread message'), 'error');
          return;
        }
        if (!channelUnreadUiState.first_unread_message_id)
          _setChannelUnreadUiState({
            ...channelUnreadUiState,
            first_unread_message_id: firstUnreadMessageId,
            last_read_message_id: lastReadMessageId,
          });
        handleHighlightedMessageChange({
          highlightDuration,
          highlightedMessageId: firstUnreadMessageId,
        });
      },
      [
        addNotification,
        channel,
        handleHighlightedMessageChange,
        loadMoreFinished,
        t,
        channelUnreadUiState,
      ],
    );

  const deleteMessage = useCallback(
    async (message: LocalMessage): Promise<MessageResponse> => {
      if (!message?.id) {
        throw new Error('Cannot delete a message - missing message ID.');
      }
      let deletedMessage;
      if (doDeleteMessageRequest) {
        deletedMessage = await doDeleteMessageRequest(message);
      } else {
        const result = await client.deleteMessage(message.id);
        deletedMessage = result.message;
      }

      return deletedMessage;
    },
    [client, doDeleteMessageRequest],
  );

  const updateMessage = (updatedMessage: MessageResponse | LocalMessage) => {
    // add the message to the local channel state
    channel.state.addMessageSorted(updatedMessage, true);

    dispatch({
      channel,
      parentId: state.thread && updatedMessage.parent_id,
      type: 'copyMessagesFromChannel',
    });
  };

  const doSendMessage = async ({
    localMessage,
    message,
    options,
  }: {
    localMessage: LocalMessage;
    message: Message;
    options?: SendMessageOptions;
  }) => {
    try {
      let messageResponse: void | SendMessageAPIResponse;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(channel, message, options);
      } else {
        messageResponse = await channel.sendMessage(message, options);
      }

      let existingMessage: LocalMessage | undefined = undefined;
      for (let i = channel.state.messages.length - 1; i >= 0; i--) {
        const msg = channel.state.messages[i];
        if (msg.id && msg.id === message.id) {
          existingMessage = msg;
          break;
        }
      }

      const responseTimestamp = new Date(
        messageResponse?.message?.updated_at || 0,
      ).getTime();
      const existingMessageTimestamp = existingMessage?.updated_at?.getTime() || 0;
      const responseIsTheNewest = responseTimestamp > existingMessageTimestamp;

      // Replace the message payload after send is completed
      // We need to check for the newest message payload, because on slow network, the response can arrive later than WS events message.new, message.updated.
      // Always override existing message in status "sending"
      if (
        messageResponse?.message &&
        (responseIsTheNewest || existingMessage?.status === 'sending')
      ) {
        updateMessage({
          ...messageResponse.message,
          status: 'received',
        });
      }
    } catch (error) {
      // error response isn't usable so needs to be stringified then parsed
      const stringError = JSON.stringify(error);
      const parsedError = (
        stringError ? JSON.parse(stringError) : {}
      ) as ErrorFromResponse<APIErrorResponse>;

      // Handle the case where the message already exists
      // (typically, when retrying to send a message).
      // If the message already exists, we can assume it was sent successfully,
      // so we update the message status to "received".
      // Right now, the only way to check this error is by checking
      // the combination of the error code and the error description,
      // since there is no special error code for duplicate messages.
      if (
        parsedError.code === 4 &&
        error instanceof Error &&
        error.message.includes('already exists')
      ) {
        updateMessage({
          ...localMessage,
          status: 'received',
        });
      } else {
        updateMessage({
          ...localMessage,
          error: parsedError,
          status: 'failed',
        });

        thread?.upsertReplyLocally({
          message: {
            ...localMessage,
            error: parsedError,
            status: 'failed',
          },
        });
      }
    }
  };

  // BREAKING: sendMessage now requires a params object instead of message
  const sendMessage = async ({
    localMessage,
    message,
    options,
  }: {
    localMessage: LocalMessage;
    message: Message;
    options?: SendMessageOptions;
  }) => {
    channel.state.filterErrorMessages();

    thread?.upsertReplyLocally({
      message: localMessage,
    });

    updateMessage(localMessage);

    await doSendMessage({ localMessage, message, options });
  };

  const retrySendMessage = async (localMessage: LocalMessage) => {
    updateMessage({
      ...localMessage,
      error: undefined,
      status: 'sending',
    });

    await doSendMessage({
      localMessage,
      message: localMessageToNewMessagePayload(localMessage),
    });
  };

  const removeMessage = (message: LocalMessage) => {
    channel.state.removeMessage(message);

    dispatch({
      channel,
      parentId: state.thread && message.parent_id,
      type: 'copyMessagesFromChannel',
    });
  };

  /** THREAD */

  const openThread = (message: LocalMessage, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    dispatch({ channel, message, type: 'openThread' });
  };

  const closeThread = (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    dispatch({ type: 'closeThread' });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMoreThreadFinished = useCallback(
    debounce(
      (
        threadHasMore: boolean,
        threadMessages: Array<ReturnType<ChannelState['formatMessage']>>,
      ) => {
        dispatch({
          threadHasMore,
          threadMessages,
          type: 'loadMoreThreadFinished',
        });
      },
      2000,
      { leading: true, trailing: true },
    ),
    [],
  );

  const loadMoreThread = async (limit: number = DEFAULT_THREAD_PAGE_SIZE) => {
    // FIXME: should prevent loading more, if state.thread.reply_count === channel.state.threads[parentID].length
    if (state.threadLoadingMore || !state.thread || !state.threadHasMore) return;

    dispatch({ type: 'startLoadingThread' });
    const parentId = state.thread.id;

    if (!parentId) {
      return dispatch({ type: 'closeThread' });
    }

    const oldMessages = channel.state.threads[parentId] || [];
    const oldestMessageId = oldMessages[0]?.id;

    try {
      const queryResponse = await channel.getReplies(parentId, {
        id_lt: oldestMessageId,
        limit,
      });

      const threadHasMoreMessages = hasMoreMessagesProbably(
        queryResponse.messages.length,
        limit,
      );
      const newThreadMessages = channel.state.threads[parentId] || [];

      // next set loadingMore to false so we can start asking for more data
      loadMoreThreadFinished(threadHasMoreMessages, newThreadMessages);
    } catch (e) {
      loadMoreThreadFinished(false, oldMessages);
    }
  };

  const onMentionsHoverOrClick = useMentionsHandlers(onMentionsHover, onMentionsClick);

  const editMessage = useEditMessageHandler(doUpdateMessageRequest);

  const { typing, ...restState } = state;

  const channelStateContextValue = useCreateChannelStateContext({
    ...restState,
    acceptedFiles,
    channel,
    channelCapabilitiesArray,
    channelConfig,
    channelUnreadUiState,
    giphyVersion: props.giphyVersion || 'fixed_height',
    imageAttachmentSizeHandler:
      props.imageAttachmentSizeHandler || getImageAttachmentConfiguration,
    maxNumberOfFiles,
    multipleUploads,
    mutes,
    notifications,
    shouldGenerateVideoThumbnail: props.shouldGenerateVideoThumbnail || true,
    videoAttachmentSizeHandler:
      props.videoAttachmentSizeHandler || getVideoAttachmentConfiguration,
    watcher_count: state.watcherCount,
  });

  const channelActionContextValue: ChannelActionContextValue = useMemo(
    () => ({
      addNotification,
      closeThread,
      deleteMessage,
      dispatch,
      editMessage,
      jumpToFirstUnreadMessage,
      jumpToLatestMessage,
      jumpToMessage,
      loadMore,
      loadMoreNewer,
      loadMoreThread,
      markRead,
      onMentionsClick: onMentionsHoverOrClick,
      onMentionsHover: onMentionsHoverOrClick,
      openThread,
      removeMessage,
      retrySendMessage,
      sendMessage,
      setChannelUnreadUiState,
      skipMessageDataMemoization,
      updateMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channel.cid,
      deleteMessage,
      loadMore,
      loadMoreNewer,
      markRead,
      jumpToFirstUnreadMessage,
      jumpToMessage,
      jumpToLatestMessage,
      setChannelUnreadUiState,
    ],
  );

  const componentContextValue: Partial<ComponentContextValue> = useMemo(
    () => ({
      Attachment: props.Attachment,
      AttachmentPreviewList: props.AttachmentPreviewList,
      AttachmentSelector: props.AttachmentSelector,
      AttachmentSelectorInitiationButtonContents:
        props.AttachmentSelectorInitiationButtonContents,
      AudioRecorder: props.AudioRecorder,
      AutocompleteSuggestionItem: props.AutocompleteSuggestionItem,
      AutocompleteSuggestionList: props.AutocompleteSuggestionList,
      Avatar: props.Avatar,
      BaseImage: props.BaseImage,
      CooldownTimer: props.CooldownTimer,
      CustomMessageActionsList: props.CustomMessageActionsList,
      DateSeparator: props.DateSeparator,
      EditMessageInput: props.EditMessageInput,
      EmojiPicker: props.EmojiPicker,
      emojiSearchIndex: props.emojiSearchIndex,
      EmptyStateIndicator: props.EmptyStateIndicator,
      FileUploadIcon: props.FileUploadIcon,
      GiphyPreviewMessage: props.GiphyPreviewMessage,
      HeaderComponent: props.HeaderComponent,
      Input: props.Input,
      LinkPreviewList: props.LinkPreviewList,
      LoadingIndicator: props.LoadingIndicator,
      Message: props.Message,
      MessageActions: props.MessageActions,
      MessageBlocked: props.MessageBlocked,
      MessageBouncePrompt: props.MessageBouncePrompt,
      MessageDeleted: props.MessageDeleted,
      MessageListNotifications: props.MessageListNotifications,
      MessageNotification: props.MessageNotification,
      MessageOptions: props.MessageOptions,
      MessageRepliesCountButton: props.MessageRepliesCountButton,
      MessageStatus: props.MessageStatus,
      MessageSystem: props.MessageSystem,
      MessageTimestamp: props.MessageTimestamp,
      ModalGallery: props.ModalGallery,
      PinIndicator: props.PinIndicator,
      PollActions: props.PollActions,
      PollContent: props.PollContent,
      PollCreationDialog: props.PollCreationDialog,
      PollHeader: props.PollHeader,
      PollOptionSelector: props.PollOptionSelector,
      QuotedMessage: props.QuotedMessage,
      QuotedMessagePreview: props.QuotedMessagePreview,
      QuotedPoll: props.QuotedPoll,
      reactionOptions: props.reactionOptions,
      ReactionSelector: props.ReactionSelector,
      ReactionsList: props.ReactionsList,
      ReactionsListModal: props.ReactionsListModal,
      SendButton: props.SendButton,
      StartRecordingAudioButton: props.StartRecordingAudioButton,
      StopAIGenerationButton: props.StopAIGenerationButton,
      StreamedMessageText: props.StreamedMessageText,
      ThreadHead: props.ThreadHead,
      ThreadHeader: props.ThreadHeader,
      ThreadStart: props.ThreadStart,
      Timestamp: props.Timestamp,
      TypingIndicator: props.TypingIndicator,
      UnreadMessagesNotification: props.UnreadMessagesNotification,
      UnreadMessagesSeparator: props.UnreadMessagesSeparator,
      VirtualMessage: props.VirtualMessage,
    }),
    [
      props.Attachment,
      props.AttachmentPreviewList,
      props.AttachmentSelector,
      props.AttachmentSelectorInitiationButtonContents,
      props.AudioRecorder,
      props.AutocompleteSuggestionItem,
      props.AutocompleteSuggestionList,
      props.Avatar,
      props.BaseImage,
      props.CooldownTimer,
      props.CustomMessageActionsList,
      props.DateSeparator,
      props.EditMessageInput,
      props.EmojiPicker,
      props.emojiSearchIndex,
      props.EmptyStateIndicator,
      props.FileUploadIcon,
      props.GiphyPreviewMessage,
      props.HeaderComponent,
      props.Input,
      props.LinkPreviewList,
      props.LoadingIndicator,
      props.Message,
      props.MessageActions,
      props.MessageBlocked,
      props.MessageBouncePrompt,
      props.MessageDeleted,
      props.MessageListNotifications,
      props.MessageNotification,
      props.MessageOptions,
      props.MessageRepliesCountButton,
      props.MessageStatus,
      props.MessageSystem,
      props.MessageTimestamp,
      props.ModalGallery,
      props.PinIndicator,
      props.PollActions,
      props.PollContent,
      props.PollCreationDialog,
      props.PollHeader,
      props.PollOptionSelector,
      props.QuotedMessage,
      props.QuotedMessagePreview,
      props.QuotedPoll,
      props.reactionOptions,
      props.ReactionSelector,
      props.ReactionsList,
      props.ReactionsListModal,
      props.SendButton,
      props.StartRecordingAudioButton,
      props.StopAIGenerationButton,
      props.StreamedMessageText,
      props.ThreadHead,
      props.ThreadHeader,
      props.ThreadStart,
      props.Timestamp,
      props.TypingIndicator,
      props.UnreadMessagesNotification,
      props.UnreadMessagesSeparator,
      props.VirtualMessage,
    ],
  );

  const typingContextValue = useCreateTypingContext({
    typing,
  });

  if (state.error) {
    return (
      <ChannelContainer>
        <LoadingErrorIndicator error={state.error} />
      </ChannelContainer>
    );
  }

  if (state.loading) {
    return (
      <ChannelContainer>
        <LoadingIndicator />
      </ChannelContainer>
    );
  }

  if (!channel.watch) {
    return (
      <ChannelContainer>
        <div>{t<string>('Channel Missing')}</div>
      </ChannelContainer>
    );
  }

  return (
    <ChannelContainer className={windowsEmojiClass}>
      <ChannelStateProvider value={channelStateContextValue}>
        <ChannelActionProvider value={channelActionContextValue}>
          <WithComponents overrides={componentContextValue}>
            <TypingProvider value={typingContextValue}>
              <div className={clsx(chatContainerClass)}>{children}</div>
            </TypingProvider>
          </WithComponents>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChannelContainer>
  );
};

/**
 * A wrapper component that provides channel data and renders children.
 * The Channel component provides the following contexts:
 * - [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/)
 * - [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/)
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const Channel = React.memo(UnMemoizedChannel) as typeof UnMemoizedChannel;
