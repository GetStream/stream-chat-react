import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import throttle from 'lodash.throttle';
import {
  APIErrorResponse,
  ChannelAPIResponse,
  ChannelMemberResponse,
  ChannelQueryOptions,
  ChannelState,
  ErrorFromResponse,
  Event,
  EventAPIResponse,
  Message,
  MessageResponse,
  SendMessageAPIResponse,
  Channel as StreamChannel,
  StreamChat,
  UpdatedMessage,
  UserResponse,
} from 'stream-chat';
import { nanoid } from 'nanoid';
import clsx from 'clsx';

import { channelReducer, ChannelStateReducer, initialState } from './channelState';
import { useCreateChannelStateContext } from './hooks/useCreateChannelStateContext';
import { useCreateTypingContext } from './hooks/useCreateTypingContext';
import { useEditMessageHandler } from './hooks/useEditMessageHandler';
import { useIsMounted } from './hooks/useIsMounted';
import { OnMentionAction, useMentionsHandlers } from './hooks/useMentionsHandlers';

import {
  LoadingErrorIndicator as DefaultLoadingErrorIndicator,
  LoadingErrorIndicatorProps,
} from '../Loading';
import { LoadingChannel as DefaultLoadingIndicator } from './LoadingChannel';
import { DropzoneProvider } from '../MessageInput/DropzoneProvider';

import {
  ChannelActionContextValue,
  ChannelActionProvider,
  ChannelNotifications,
  ChannelStateProvider,
  ComponentContextValue,
  MarkReadWrapperOptions,
  MessageToSend,
  StreamMessage,
  TypingProvider,
  useChatContext,
  useTranslationContext,
  WithComponents,
} from '../../context';

import {
  DEFAULT_HIGHLIGHT_DURATION,
  DEFAULT_INITIAL_CHANNEL_PAGE_SIZE,
  DEFAULT_JUMP_TO_PAGE_SIZE,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
  DEFAULT_THREAD_PAGE_SIZE,
} from '../../constants/limits';

import { hasMoreMessagesProbably } from '../MessageList';
import { useChannelContainerClasses } from './hooks/useChannelContainerClasses';
import { findInMsgSetByDate, findInMsgSetById, makeAddNotifications } from './utils';
import { getChannel } from '../../utils';

import type { MessageInputProps } from '../MessageInput';

import type {
  ChannelUnreadUiState,
  CustomTrigger,
  DefaultStreamChatGenerics,
  GiphyVersions,
  ImageAttachmentSizeHandler,
  SendMessageOptions,
  UpdateMessageOptions,
  VideoAttachmentSizeHandler,
} from '../../types/types';
import {
  getImageAttachmentConfiguration,
  getVideoAttachmentConfiguration,
} from '../Attachment/attachment-sizing';
import type { URLEnrichmentConfig } from '../MessageInput/hooks/useLinkPreviews';
import { useThreadContext } from '../Threads';

type ChannelPropsForwardedToComponentContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Pick<
  ComponentContextValue<StreamChatGenerics>,
  | 'Attachment'
  | 'AttachmentPreviewList'
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
  | 'MessageBouncePrompt'
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
  | 'QuotedMessage'
  | 'QuotedMessagePreview'
  | 'reactionOptions'
  | 'ReactionSelector'
  | 'ReactionsList'
  | 'SendButton'
  | 'StartRecordingAudioButton'
  | 'ThreadHead'
  | 'ThreadHeader'
  | 'ThreadStart'
  | 'Timestamp'
  | 'TriggerProvider'
  | 'TypingIndicator'
  | 'UnreadMessagesNotification'
  | 'UnreadMessagesSeparator'
  | 'VirtualMessage'
>;

const isUserResponseArray = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  output: string[] | UserResponse<StreamChatGenerics>[],
): output is UserResponse<StreamChatGenerics>[] =>
  (output as UserResponse<StreamChatGenerics>[])[0]?.id != null;

export type ChannelProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = ChannelPropsForwardedToComponentContext<StreamChatGenerics> & {
  /** List of accepted file types */
  acceptedFiles?: string[];
  /** Custom handler function that runs when the active channel has unread messages and the app is running on a separate browser tab */
  activeUnreadHandler?: (unread: number, documentTitle: string) => void;
  /** The connected and active channel */
  channel?: StreamChannel<StreamChatGenerics>;
  /**
   * Optional configuration parameters used for the initial channel query.
   * Applied only if the value of channel.initialized is false.
   * If the channel instance has already been initialized (channel has been queried),
   * then the channel query will be skipped and channelQueryOptions will not be applied.
   */
  channelQueryOptions?: ChannelQueryOptions<StreamChatGenerics>;
  /** Custom action handler to override the default `client.deleteMessage(message.id)` function */
  doDeleteMessageRequest?: (
    message: StreamMessage<StreamChatGenerics>,
  ) => Promise<MessageResponse<StreamChatGenerics>>;
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel<StreamChatGenerics>,
    setChannelUnreadUiState?: (state: ChannelUnreadUiState) => void,
  ) => Promise<EventAPIResponse<StreamChatGenerics>> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function (advanced usage only) */
  doSendMessageRequest?: (
    channel: StreamChannel<StreamChatGenerics>,
    message: Message<StreamChatGenerics>,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel<StreamChatGenerics>['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function (advanced usage only) */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: UpdatedMessage<StreamChatGenerics>,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat<StreamChatGenerics>['updateMessage']>;
  /** If true, chat users will be able to drag and drop file uploads to the entire channel window */
  dragAndDropWindow?: boolean;
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
  EmptyPlaceholder?: React.ReactElement;
  /**
   * A global flag to toggle the URL enrichment and link previews in `MessageInput` components.
   * By default, the feature is disabled. Can be overridden on Thread, MessageList level through additionalMessageInputProps
   * or directly on MessageInput level through urlEnrichmentConfig.
   */
  enrichURLForPreview?: URLEnrichmentConfig['enrichURLForPreview'];
  /** Global configuration for link preview generation in all the MessageInput components */
  enrichURLForPreviewConfig?: Omit<URLEnrichmentConfig, 'enrichURLForPreview'>;
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
  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles?: number;
  /** Whether to allow multiple attachment uploads */
  multipleUploads?: boolean;
  /** Custom action handler function to run on click of an @mention in a message */
  onMentionsClick?: OnMentionAction<StreamChatGenerics>;
  /** Custom action handler function to run on hover of an @mention in a message */
  onMentionsHover?: OnMentionAction<StreamChatGenerics>;
  /** If `dragAndDropWindow` prop is true, the props to pass to the MessageInput component (overrides props placed directly on MessageInput) */
  optionalMessageInputProps?: MessageInputProps<StreamChatGenerics, V>;
  /** You can turn on/off thumbnail generation for video attachments */
  shouldGenerateVideoThumbnail?: boolean;
  /** If true, skips the message data string comparison used to memoize the current channel messages (helpful for channels with 1000s of messages) */
  skipMessageDataMemoization?: boolean;
  /** A custom function to provide size configuration for video attachments */
  videoAttachmentSizeHandler?: VideoAttachmentSizeHandler;
};

const UnMemoizedChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<ChannelProps<StreamChatGenerics, V>>,
) => {
  const {
    channel: propsChannel,
    EmptyPlaceholder = null,
    LoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
  } = props;

  const {
    channel: contextChannel,
    channelsQueryState,
    customClasses,
    theme,
  } = useChatContext<StreamChatGenerics>('Channel');
  const { channelClass, chatClass } = useChannelContainerClasses({
    customClasses,
  });

  const channel = propsChannel || contextChannel;

  const className = clsx(chatClass, theme, channelClass);

  if (channelsQueryState.queryInProgress === 'reload' && LoadingIndicator) {
    return (
      <div className={className}>
        <LoadingIndicator />
      </div>
    );
  }

  if (channelsQueryState.error && LoadingErrorIndicator) {
    return (
      <div className={className}>
        <LoadingErrorIndicator error={channelsQueryState.error} />
      </div>
    );
  }

  if (!channel?.cid) {
    return <div className={className}>{EmptyPlaceholder}</div>;
  }

  return <ChannelInner {...props} channel={channel} key={channel.cid} />;
};

const ChannelInner = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<
    ChannelProps<StreamChatGenerics, V> & {
      channel: StreamChannel<StreamChatGenerics>;
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
    dragAndDropWindow = false,
    enrichURLForPreviewConfig,
    initializeOnMount = true,
    LoadingErrorIndicator = DefaultLoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    markReadOnMount = true,
    maxNumberOfFiles,
    multipleUploads = true,
    onMentionsClick,
    onMentionsHover,
    optionalMessageInputProps = {},
    skipMessageDataMemoization,
  } = props;

  const channelQueryOptions: ChannelQueryOptions<StreamChatGenerics> & {
    messages: { limit: number };
  } = useMemo(
    () =>
      defaultsDeep(propChannelQueryOptions, {
        messages: { limit: DEFAULT_INITIAL_CHANNEL_PAGE_SIZE },
      }),
    [propChannelQueryOptions],
  );

  const {
    client,
    customClasses,
    latestMessageDatesByChannels,
    mutes,
    theme,
  } = useChatContext<StreamChatGenerics>('Channel');
  const { t } = useTranslationContext('Channel');
  const {
    channelClass,
    chatClass,
    chatContainerClass,
    windowsEmojiClass,
  } = useChannelContainerClasses({ customClasses });

  const thread = useThreadContext();

  const [channelConfig, setChannelConfig] = useState(channel.getConfig());
  const [notifications, setNotifications] = useState<ChannelNotifications>([]);
  const [quotedMessage, setQuotedMessage] = useState<StreamMessage<StreamChatGenerics>>();
  const [channelUnreadUiState, _setChannelUnreadUiState] = useState<ChannelUnreadUiState>();

  const notificationTimeouts = useRef<Array<NodeJS.Timeout>>([]);

  const [state, dispatch] = useReducer<ChannelStateReducer<StreamChatGenerics>>(
    channelReducer,
    // channel.initialized === false if client.channel().query() was not called, e.g. ChannelList is not used
    // => Channel will call channel.watch() in useLayoutEffect => state.loading is used to signal the watch() call state
    {
      ...initialState,
      hasMore: channel.state.messagePagination.hasPrev,
      loading: !channel.initialized,
    },
  );

  const isMounted = useIsMounted();

  const originalTitle = useRef('');
  const lastRead = useRef<Date | undefined>();
  const online = useRef(true);

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
    [activeUnreadHandler, channel, channelConfig, doMarkReadRequest, setChannelUnreadUiState, t],
  );

  const handleEvent = async (event: Event<StreamChatGenerics>) => {
    if (event.message) {
      dispatch({
        channel,
        message: event.message,
        type: 'updateThreadOnEvent',
      });
    }

    if (event.type === 'user.watching.start' || event.type === 'user.watching.stop') return;

    if (event.type === 'typing.start' || event.type === 'typing.stop') {
      return dispatch({ channel, type: 'setTyping' });
    }

    if (event.type === 'connection.changed' && typeof event.online === 'boolean') {
      online.current = event.online;
    }

    if (event.type === 'message.new') {
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;

      if (mainChannelUpdated) {
        if (document.hidden && channelConfig?.read_events && !channel.muteStatus().muted) {
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
                const { user, user_id } = member as ChannelMemberResponse<StreamChatGenerics>;
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

  /** MESSAGE */

  // Adds a temporary notification to message list, will be removed after 5 seconds
  const addNotification = useMemo(
    () => makeAddNotifications(setNotifications, notificationTimeouts.current),
    [],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadMoreFinished = useCallback(
    debounce(
      (hasMore: boolean, messages: ChannelState<StreamChatGenerics>['messages']) => {
        if (!isMounted.current) return;
        dispatch({ hasMore, messages, type: 'loadMoreFinished' });
      },
      2000,
      { leading: true, trailing: true },
    ),
    [],
  );

  const loadMore = async (limit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE) => {
    if (!online.current || !window.navigator.onLine || !channel.state.messagePagination.hasPrev)
      return 0;

    // prevent duplicate loading events...
    const oldestMessage = state?.messages?.[0];

    if (state.loadingMore || state.loadingMoreNewer || oldestMessage?.status !== 'received') {
      return 0;
    }

    dispatch({ loadingMore: true, type: 'setLoadingMore' });

    const oldestID = oldestMessage?.id;
    const perPage = limit;
    let queryResponse: ChannelAPIResponse<StreamChatGenerics>;

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
    if (!online.current || !window.navigator.onLine || !channel.state.messagePagination.hasNext)
      return 0;

    const newestMessage = state?.messages?.[state?.messages?.length - 1];
    if (state.loadingMore || state.loadingMoreNewer) return 0;

    dispatch({ loadingMoreNewer: true, type: 'setLoadingMoreNewer' });

    const newestId = newestMessage?.id;
    const perPage = limit;
    let queryResponse: ChannelAPIResponse<StreamChatGenerics>;

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

  const clearHighlightedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToMessage: ChannelActionContextValue<StreamChatGenerics>['jumpToMessage'] = useCallback(
    async (
      messageId,
      messageLimit = DEFAULT_JUMP_TO_PAGE_SIZE,
      highlightDuration = DEFAULT_HIGHLIGHT_DURATION,
    ) => {
      dispatch({ loadingMore: true, type: 'setLoadingMore' });
      await channel.state.loadMessageIntoState(messageId, undefined, messageLimit);

      loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
      dispatch({
        hasMoreNewer: channel.state.messagePagination.hasNext,
        highlightedMessageId: messageId,
        type: 'jumpToMessageFinished',
      });

      if (clearHighlightedMessageTimeoutId.current) {
        clearTimeout(clearHighlightedMessageTimeoutId.current);
      }

      clearHighlightedMessageTimeoutId.current = setTimeout(() => {
        clearHighlightedMessageTimeoutId.current = null;
        dispatch({ type: 'clearHighlightedMessage' });
      }, highlightDuration);
    },
    [channel, loadMoreFinished],
  );

  const jumpToLatestMessage: ChannelActionContextValue<StreamChatGenerics>['jumpToLatestMessage'] = useCallback(async () => {
    await channel.state.loadMessageIntoState('latest');
    loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
    dispatch({
      type: 'jumpToLatestMessage',
    });
  }, [channel, loadMoreFinished]);

  const jumpToFirstUnreadMessage: ChannelActionContextValue<StreamChatGenerics>['jumpToFirstUnreadMessage'] = useCallback(
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
        const { index: lastReadMessageIndex, target: lastReadMessage } = findInMsgSetByDate(
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
            loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
            return;
          }

          const firstMessageWithCreationDate = messages.find((msg) => msg.created_at);
          if (!firstMessageWithCreationDate) {
            addNotification(t('Failed to jump to the first unread message'), 'error');
            loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
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
          loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
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
          await channel.state.loadMessageIntoState(targetId, undefined, queryMessageLimit);
          /**
           * if the index of the last read message on the page is beyond the half of the page,
           * we have arrived to the oldest page of the channel
           */
          const indexOfTarget = channel.state.messages.findIndex(
            (message) => message.id === targetId,
          ) as number;
          loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
          firstUnreadMessageId =
            firstUnreadMessageId ?? channel.state.messages[indexOfTarget + 1]?.id;
        } catch (e) {
          addNotification(t('Failed to jump to the first unread message'), 'error');
          loadMoreFinished(channel.state.messagePagination.hasPrev, channel.state.messages);
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

      dispatch({
        hasMoreNewer: channel.state.messagePagination.hasNext,
        highlightedMessageId: firstUnreadMessageId,
        type: 'jumpToMessageFinished',
      });

      if (clearHighlightedMessageTimeoutId.current) {
        clearTimeout(clearHighlightedMessageTimeoutId.current);
      }

      clearHighlightedMessageTimeoutId.current = setTimeout(() => {
        clearHighlightedMessageTimeoutId.current = null;
        dispatch({ type: 'clearHighlightedMessage' });
      }, highlightDuration);
    },
    [addNotification, channel, loadMoreFinished, t, channelUnreadUiState],
  );

  const deleteMessage = useCallback(
    async (
      message: StreamMessage<StreamChatGenerics>,
    ): Promise<MessageResponse<StreamChatGenerics>> => {
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

  const updateMessage = (
    updatedMessage: MessageToSend<StreamChatGenerics> | StreamMessage<StreamChatGenerics>,
  ) => {
    // add the message to the local channel state
    channel.state.addMessageSorted(updatedMessage as MessageResponse<StreamChatGenerics>, true);

    dispatch({
      channel,
      parentId: state.thread && updatedMessage.parent_id,
      type: 'copyMessagesFromChannel',
    });
  };

  const doSendMessage = async (
    message: MessageToSend<StreamChatGenerics> | StreamMessage<StreamChatGenerics>,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => {
    const { attachments, id, mentioned_users = [], parent_id, text } = message;

    // channel.sendMessage expects an array of user id strings
    const mentions = isUserResponseArray<StreamChatGenerics>(mentioned_users)
      ? mentioned_users.map(({ id }) => id)
      : mentioned_users;

    const messageData = {
      attachments,
      id,
      mentioned_users: mentions,
      parent_id,
      quoted_message_id: parent_id === quotedMessage?.parent_id ? quotedMessage?.id : undefined,
      text,
      ...customMessageData,
    } as Message<StreamChatGenerics>;

    try {
      let messageResponse: void | SendMessageAPIResponse<StreamChatGenerics>;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(channel, messageData, options);
      } else {
        messageResponse = await channel.sendMessage(messageData, options);
      }

      let existingMessage;
      for (let i = channel.state.messages.length - 1; i >= 0; i--) {
        const msg = channel.state.messages[i];
        if (msg.id && msg.id === messageData.id) {
          existingMessage = msg;
          break;
        }
      }

      const responseTimestamp = new Date(messageResponse?.message?.updated_at || 0).getTime();
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

      if (quotedMessage && parent_id === quotedMessage?.parent_id) setQuotedMessage(undefined);
    } catch (error) {
      // error response isn't usable so needs to be stringified then parsed
      const stringError = JSON.stringify(error);
      const parsedError = (stringError
        ? JSON.parse(stringError)
        : {}) as ErrorFromResponse<APIErrorResponse>;

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
          ...message,
          status: 'received',
        });
      } else {
        updateMessage({
          ...message,
          error: parsedError,
          errorStatusCode: parsedError.status || undefined,
          status: 'failed',
        });

        thread?.upsertReplyLocally({
          // @ts-expect-error
          message: {
            ...message,
            error: parsedError,
            errorStatusCode: parsedError.status || undefined,
            status: 'failed',
          },
        });
      }
    }
  };

  const sendMessage = async (
    {
      attachments = [],
      mentioned_users = [],
      parent,
      text = '',
    }: MessageToSend<StreamChatGenerics>,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => {
    channel.state.filterErrorMessages();

    const messagePreview = {
      attachments,
      created_at: new Date(),
      html: text,
      id: customMessageData?.id ?? `${client.userID}-${nanoid()}`,
      mentioned_users,
      parent_id: parent?.id,
      reactions: [],
      status: 'sending',
      text,
      type: 'regular',
      user: client.user,
    };

    thread?.upsertReplyLocally({
      // @ts-expect-error
      message: messagePreview,
    });

    updateMessage(messagePreview);

    await doSendMessage(messagePreview, customMessageData, options);
  };

  const retrySendMessage = async (message: StreamMessage<StreamChatGenerics>) => {
    updateMessage({
      ...message,
      errorStatusCode: undefined,
      status: 'sending',
    });

    if (message.attachments) {
      // remove scraped attachments added during the message composition in MessageInput to prevent sync issues
      message.attachments = message.attachments.filter((attachment) => !attachment.og_scrape_url);
    }

    await doSendMessage(message);
  };

  const removeMessage = (message: StreamMessage<StreamChatGenerics>) => {
    channel.state.removeMessage(message);

    dispatch({
      channel,
      parentId: state.thread && message.parent_id,
      type: 'copyMessagesFromChannel',
    });
  };

  /** THREAD */

  const openThread = (
    message: StreamMessage<StreamChatGenerics>,
    event?: React.BaseSyntheticEvent,
  ) => {
    event?.preventDefault();
    setQuotedMessage((current) => {
      if (current?.parent_id !== message?.parent_id) {
        return undefined;
      } else {
        return current;
      }
    });
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
        threadMessages: Array<ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>>,
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

      const threadHasMoreMessages = hasMoreMessagesProbably(queryResponse.messages.length, limit);
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

  const channelStateContextValue = useCreateChannelStateContext<StreamChatGenerics>({
    ...restState,
    acceptedFiles,
    channel,
    channelCapabilitiesArray,
    channelConfig,
    channelUnreadUiState,
    debounceURLEnrichmentMs: enrichURLForPreviewConfig?.debounceURLEnrichmentMs,
    dragAndDropWindow,
    enrichURLForPreview: props.enrichURLForPreview,
    findURLFn: enrichURLForPreviewConfig?.findURLFn,
    giphyVersion: props.giphyVersion || 'fixed_height',
    imageAttachmentSizeHandler: props.imageAttachmentSizeHandler || getImageAttachmentConfiguration,
    maxNumberOfFiles,
    multipleUploads,
    mutes,
    notifications,
    onLinkPreviewDismissed: enrichURLForPreviewConfig?.onLinkPreviewDismissed,
    quotedMessage,
    shouldGenerateVideoThumbnail: props.shouldGenerateVideoThumbnail || true,
    videoAttachmentSizeHandler: props.videoAttachmentSizeHandler || getVideoAttachmentConfiguration,
    watcher_count: state.watcherCount,
  });

  const channelActionContextValue: ChannelActionContextValue<StreamChatGenerics> = useMemo(
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
      setQuotedMessage,
      skipMessageDataMemoization,
      updateMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channel.cid,
      deleteMessage,
      enrichURLForPreviewConfig?.findURLFn,
      enrichURLForPreviewConfig?.onLinkPreviewDismissed,
      loadMore,
      loadMoreNewer,
      markRead,
      quotedMessage,
      jumpToFirstUnreadMessage,
      jumpToMessage,
      jumpToLatestMessage,
      setChannelUnreadUiState,
    ],
  );

  // @ts-expect-error
  const componentContextValue: Partial<ComponentContextValue> = useMemo(
    () => ({
      Attachment: props.Attachment,
      AttachmentPreviewList: props.AttachmentPreviewList,
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
      QuotedMessage: props.QuotedMessage,
      QuotedMessagePreview: props.QuotedMessagePreview,
      reactionOptions: props.reactionOptions,
      ReactionSelector: props.ReactionSelector,
      ReactionsList: props.ReactionsList,
      SendButton: props.SendButton,
      StartRecordingAudioButton: props.StartRecordingAudioButton,
      ThreadHead: props.ThreadHead,
      ThreadHeader: props.ThreadHeader,
      ThreadStart: props.ThreadStart,
      Timestamp: props.Timestamp,
      TriggerProvider: props.TriggerProvider,
      TypingIndicator: props.TypingIndicator,
      UnreadMessagesNotification: props.UnreadMessagesNotification,
      UnreadMessagesSeparator: props.UnreadMessagesSeparator,
      VirtualMessage: props.VirtualMessage,
    }),
    [
      props.Attachment,
      props.AttachmentPreviewList,
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
      props.EmptyStateIndicator,
      props.FileUploadIcon,
      props.GiphyPreviewMessage,
      props.HeaderComponent,
      props.Input,
      props.LinkPreviewList,
      props.LoadingIndicator,
      props.Message,
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
      props.QuotedMessage,
      props.QuotedMessagePreview,
      props.ReactionSelector,
      props.ReactionsList,
      props.SendButton,
      props.StartRecordingAudioButton,
      props.ThreadHead,
      props.ThreadHeader,
      props.ThreadStart,
      props.Timestamp,
      props.TriggerProvider,
      props.TypingIndicator,
      props.UnreadMessagesNotification,
      props.UnreadMessagesSeparator,
      props.VirtualMessage,
      props.emojiSearchIndex,
      props.reactionOptions,
    ],
  );

  const typingContextValue = useCreateTypingContext({
    typing,
  });

  const className = clsx(chatClass, theme, channelClass);

  if (state.error) {
    return (
      <div className={className}>
        <LoadingErrorIndicator error={state.error} />
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className={className}>
        <LoadingIndicator />
      </div>
    );
  }

  if (!channel.watch) {
    return (
      <div className={className}>
        <div>{t<string>('Channel Missing')}</div>
      </div>
    );
  }

  return (
    <div className={clsx(className, windowsEmojiClass)}>
      <ChannelStateProvider value={channelStateContextValue}>
        <ChannelActionProvider value={channelActionContextValue}>
          <WithComponents overrides={componentContextValue}>
            <TypingProvider value={typingContextValue}>
              <div className={`${chatContainerClass}`}>
                {dragAndDropWindow && (
                  <DropzoneProvider {...optionalMessageInputProps}>{children}</DropzoneProvider>
                )}
                {!dragAndDropWindow && <>{children}</>}
              </div>
            </TypingProvider>
          </WithComponents>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </div>
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
