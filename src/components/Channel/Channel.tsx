import React, {
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import {
  ChannelAPIResponse,
  ChannelState,
  Event,
  logChatPromiseExecution,
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
import { commonEmoji, defaultMinimalEmojis, emojiSetDef } from './emojiData';
import { useCreateChannelStateContext } from './hooks/useCreateChannelStateContext';
import { useCreateTypingContext } from './hooks/useCreateTypingContext';
import { useEditMessageHandler } from './hooks/useEditMessageHandler';
import { useIsMounted } from './hooks/useIsMounted';
import { OnMentionAction, useMentionsHandlers } from './hooks/useMentionsHandlers';

import { Attachment as DefaultAttachment } from '../Attachment/Attachment';
import {
  LoadingErrorIndicator as DefaultLoadingErrorIndicator,
  LoadingErrorIndicatorProps,
} from '../Loading';
import { LoadingChannel as DefaultLoadingIndicator } from './LoadingChannel';
import { MessageSimple } from '../Message/MessageSimple';
import { DropzoneProvider } from '../MessageInput/DropzoneProvider';

import {
  ChannelActionContextValue,
  ChannelActionProvider,
  MessageToSend,
} from '../../context/ChannelActionContext';
import {
  ChannelNotifications,
  ChannelStateProvider,
  StreamMessage,
} from '../../context/ChannelStateContext';
import { ComponentContextValue, ComponentProvider } from '../../context/ComponentContext';
import { useChatContext } from '../../context/ChatContext';
import { EmojiConfig, EmojiContextValue, EmojiProvider } from '../../context/EmojiContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { TypingProvider } from '../../context/TypingContext';

import {
  DEFAULT_INITIAL_CHANNEL_PAGE_SIZE,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
  DEFAULT_THREAD_PAGE_SIZE,
} from '../../constants/limits';

import { hasMoreMessagesProbably, hasNotMoreMessages } from '../MessageList/utils';
import defaultEmojiData from '../../stream-emoji.json';
import { makeAddNotifications } from './utils';

import type { Data as EmojiMartData } from 'emoji-mart';

import type { MessageProps } from '../Message/types';
import type { MessageInputProps } from '../MessageInput/MessageInput';

import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  GiphyVersions,
  ImageAttachmentSizeHandler,
  VideoAttachmentSizeHandler,
} from '../../types/types';
import { useChannelContainerClasses } from './hooks/useChannelContainerClasses';
import {
  getImageAttachmentConfiguration,
  getVideoAttachmentConfiguration,
} from '../Attachment/attachment-sizing';

export type ChannelProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  /** List of accepted file types */
  acceptedFiles?: string[];
  /** Custom handler function that runs when the active channel has unread messages (i.e., when chat is running on a separate browser tab) */
  activeUnreadHandler?: (unread: number, documentTitle: string) => void;
  /** Custom UI component to display a message attachment, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Attachment.tsx) */
  Attachment?: ComponentContextValue<StreamChatGenerics>['Attachment'];
  /** Optional UI component to override the default suggestion Header component, defaults to and accepts same props as: [Header](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Header.tsx) */
  AutocompleteSuggestionHeader?: ComponentContextValue<StreamChatGenerics>['AutocompleteSuggestionHeader'];
  /** Optional UI component to override the default suggestion Item component, defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js) */
  AutocompleteSuggestionItem?: ComponentContextValue<StreamChatGenerics>['AutocompleteSuggestionItem'];
  /** Optional UI component to override the default List component that displays suggestions, defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js) */
  AutocompleteSuggestionList?: ComponentContextValue<StreamChatGenerics>['AutocompleteSuggestionList'];
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: ComponentContextValue<StreamChatGenerics>['Avatar'];
  /** The connected and active channel */
  channel?: StreamChannel<StreamChatGenerics>;
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/hooks/useCooldownTimer.tsx) */
  CooldownTimer?: ComponentContextValue<StreamChatGenerics>['CooldownTimer'];
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: ComponentContextValue<StreamChatGenerics>['DateSeparator'];
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel<StreamChatGenerics>,
  ) => Promise<MessageResponse<StreamChatGenerics>> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function (advanced usage only) */
  doSendMessageRequest?: (
    channelId: string,
    message: Message<StreamChatGenerics>,
  ) => ReturnType<StreamChannel<StreamChatGenerics>['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function (advanced usage only) */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: UpdatedMessage<StreamChatGenerics>,
  ) => ReturnType<StreamChat<StreamChatGenerics>['updateMessage']>;
  /** If true, chat users will be able to drag and drop file uploads to the entire channel window */
  dragAndDropWindow?: boolean;
  /** Custom UI component to override default edit message input, defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx) */
  EditMessageInput?: ComponentContextValue<StreamChatGenerics>['EditMessageInput'];
  /** Custom UI component to override default `NimbleEmoji` from `emoji-mart` */
  Emoji?: EmojiContextValue['Emoji'];
  /** Custom prop to override default `facebook.json` emoji data set from `emoji-mart` */
  emojiData?: EmojiMartData;
  /** Custom UI component for emoji button in input, defaults to and accepts same props as: [EmojiIconSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  EmojiIcon?: ComponentContextValue<StreamChatGenerics>['EmojiIcon'];
  /** Custom UI component to override default `NimbleEmojiIndex` from `emoji-mart` */
  EmojiIndex?: EmojiContextValue['EmojiIndex'];
  /** Custom UI component to override default `NimblePicker` from `emoji-mart` */
  EmojiPicker?: EmojiContextValue['EmojiPicker'];
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
  EmptyPlaceholder?: React.ReactElement;
  /** Custom UI component to be displayed when the `MessageList` is empty, , defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx)  */
  EmptyStateIndicator?: ComponentContextValue<StreamChatGenerics>['EmptyStateIndicator'];
  /** Custom UI component for file upload icon, defaults to and accepts same props as: [FileUploadIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  FileUploadIcon?: ComponentContextValue<StreamChatGenerics>['FileUploadIcon'];
  /** Custom UI component to render a Giphy preview in the `VirtualizedMessageList` */
  GiphyPreviewMessage?: ComponentContextValue<StreamChatGenerics>['GiphyPreviewMessage'];
  /** The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default */
  giphyVersion?: GiphyVersions;
  /** Custom UI component to render at the top of the `MessageList` */
  HeaderComponent?: ComponentContextValue<StreamChatGenerics>['HeaderComponent'];
  /** A custom function to provide size configuration for image attachments */
  imageAttachmentSizeHandler?: ImageAttachmentSizeHandler;
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: ComponentContextValue<StreamChatGenerics>['Input'];
  /** Custom UI component to be shown if the channel query fails, defaults to and accepts same props as: [LoadingErrorIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingErrorIndicator.tsx) */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to render while the `MessageList` is loading new messages, defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingIndicator.tsx) */
  LoadingIndicator?: ComponentContextValue<StreamChatGenerics>['LoadingIndicator'];
  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles?: number;
  /** Custom UI component to display a message in the standard `MessageList`, defaults to and accepts the same props as: [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: ComponentContextValue<StreamChatGenerics>['Message'];
  /** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx) */
  MessageDeleted?: ComponentContextValue<StreamChatGenerics>['MessageDeleted'];
  /** Custom UI component that displays message and connection status notifications in the `MessageList`, defaults to and accepts same props as [DefaultMessageListNotifications](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageListNotifications.tsx) */
  MessageListNotifications?: ComponentContextValue<StreamChatGenerics>['MessageListNotifications'];
  /** Custom UI component to display a notification when scrolled up the list and new messages arrive, defaults to and accepts same props as [MessageNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageNotification.tsx) */
  MessageNotification?: ComponentContextValue<StreamChatGenerics>['MessageNotification'];
  /** Custom UI component for message options popup, defaults to and accepts same props as: [MessageOptions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageOptions.tsx) */
  MessageOptions?: ComponentContextValue<StreamChatGenerics>['MessageOptions'];
  /** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx) */
  MessageRepliesCountButton?: ComponentContextValue<StreamChatGenerics>['MessageRepliesCountButton'];
  /** Custom UI component to display message delivery status, defaults to and accepts same props as: [MessageStatus](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageStatus.tsx) */
  MessageStatus?: ComponentContextValue<StreamChatGenerics>['MessageStatus'];
  /** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent/EventComponent.tsx) */
  MessageSystem?: ComponentContextValue<StreamChatGenerics>['MessageSystem'];
  /** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx) */
  MessageTimestamp?: ComponentContextValue<StreamChatGenerics>['MessageTimestamp'];
  /** Custom UI component for viewing message's image attachments, defaults to and accepts the same props as [ModalGallery](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/ModalGallery.tsx) */
  ModalGallery?: ComponentContextValue<StreamChatGenerics>['ModalGallery'];
  /** Whether to allow multiple attachment uploads */
  multipleUploads?: boolean;
  /** Custom action handler function to run on click of an @mention in a message */
  onMentionsClick?: OnMentionAction<StreamChatGenerics>;
  /** Custom action handler function to run on hover of an @mention in a message */
  onMentionsHover?: OnMentionAction<StreamChatGenerics>;
  /** If `dragAndDropWindow` prop is true, the props to pass to the MessageInput component (overrides props placed directly on MessageInput) */
  optionalMessageInputProps?: MessageInputProps<StreamChatGenerics, V>;
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx) */
  PinIndicator?: ComponentContextValue<StreamChatGenerics>['PinIndicator'];
  /** Custom UI component to override quoted message UI on a sent message, defaults to and accepts same props as: [QuotedMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/QuotedMessage.tsx) */
  QuotedMessage?: ComponentContextValue<StreamChatGenerics>['QuotedMessage'];
  /** Custom UI component to override the message input's quoted message preview, defaults to and accepts same props as: [QuotedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/QuotedMessagePreview.tsx) */
  QuotedMessagePreview?: ComponentContextValue<StreamChatGenerics>['QuotedMessagePreview'];
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: ComponentContextValue<StreamChatGenerics>['ReactionSelector'];
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: ComponentContextValue<StreamChatGenerics>['ReactionsList'];
  /** Custom UI component for send button, defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  SendButton?: ComponentContextValue<StreamChatGenerics>['SendButton'];
  /** You can turn on/off thumbnail generation for video attachments */
  shouldGenerateVideoThumbnail?: boolean;
  /** If true, skips the message data string comparison used to memoize the current channel messages (helpful for channels with 1000s of messages) */
  skipMessageDataMemoization?: boolean;
  /** Custom UI component that displays thread's parent or other message at the top of the `MessageList`, defaults to and accepts same props as [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  ThreadHead?: React.ComponentType<MessageProps<StreamChatGenerics>>;
  /** Custom UI component to display the header of a `Thread`, defaults to and accepts same props as: [DefaultThreadHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadHeader?: ComponentContextValue<StreamChatGenerics>['ThreadHeader'];
  /** Custom UI component to display the start of a threaded `MessageList`, defaults to and accepts same props as: [DefaultThreadStart](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadStart?: ComponentContextValue<StreamChatGenerics>['ThreadStart'];
  /** Optional context provider that lets you override the default autocomplete triggers, defaults to: [DefaultTriggerProvider](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/DefaultTriggerProvider.tsx) */
  TriggerProvider?: ComponentContextValue<StreamChatGenerics>['TriggerProvider'];
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: ComponentContextValue<StreamChatGenerics>['TypingIndicator'];
  /** A custom function to provide size configuration for video attachments */
  videoAttachmentSizeHandler?: VideoAttachmentSizeHandler;
  /** Custom UI component to display a message in the `VirtualizedMessageList`, does not have a default implementation */
  VirtualMessage?: ComponentContextValue<StreamChatGenerics>['VirtualMessage'];
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

  // @ts-ignore
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
    children,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    dragAndDropWindow = false,
    emojiData = defaultEmojiData,
    LoadingErrorIndicator = DefaultLoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    maxNumberOfFiles,
    multipleUploads = true,
    onMentionsClick,
    onMentionsHover,
    optionalMessageInputProps = {},
    skipMessageDataMemoization,
  } = props;

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

  const [channelConfig, setChannelConfig] = useState(channel.getConfig());
  const [notifications, setNotifications] = useState<ChannelNotifications>([]);
  const [quotedMessage, setQuotedMessage] = useState<StreamMessage<StreamChatGenerics>>();

  const notificationTimeouts: Array<NodeJS.Timeout> = [];

  const [state, dispatch] = useReducer<ChannelStateReducer<StreamChatGenerics>>(
    channelReducer,
    // channel.initialized === false if client.channels() was not called, e.g. ChannelList is not used
    // => Channel will call channel.watch() in useLayoutEffect => state.loading is used to signal the watch() call state
    { ...initialState, loading: !channel.initialized },
  );

  const isMounted = useIsMounted();

  const originalTitle = useRef('');
  const lastRead = useRef(new Date());
  const online = useRef(true);

  const channelCapabilitiesArray = channel.data?.own_capabilities as string[];

  const emojiConfig: EmojiConfig = {
    commonEmoji,
    defaultMinimalEmojis,
    emojiData,
    emojiSetDef,
  };

  const throttledCopyStateFromChannel = throttle(
    () => dispatch({ channel, type: 'copyStateFromChannelOnEvent' }),
    500,
    {
      leading: true,
      trailing: true,
    },
  );

  const markRead = () => {
    if (channel.disconnected || !channelConfig?.read_events) {
      return;
    }

    lastRead.current = new Date();

    if (doMarkReadRequest) {
      doMarkReadRequest(channel);
    } else {
      logChatPromiseExecution(channel.markRead(), 'mark read');
    }

    if (activeUnreadHandler) {
      activeUnreadHandler(0, originalTitle.current);
    } else if (originalTitle.current) {
      document.title = originalTitle.current;
    }
  };

  const markReadThrottled = throttle(markRead, 500, { leading: true, trailing: true });

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
      let mainChannelUpdated = true;

      if (event.message?.parent_id && !event.message?.show_in_channel) {
        mainChannelUpdated = false;
      }

      if (mainChannelUpdated && event.message?.user?.id !== client.userID) {
        if (!document.hidden) {
          markReadThrottled();
        } else if (channelConfig?.read_events && !channel.muteStatus().muted) {
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
      await channel.query({
        messages: { id_lt: oldestID, limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
        watchers: { limit: DEFAULT_NEXT_CHANNEL_PAGE_SIZE },
      });
    }

    throttledCopyStateFromChannel();
  };

  // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release
  useLayoutEffect(() => {
    let errored = false;
    let done = false;

    const onVisibilityChange = () => {
      if (!document.hidden) markRead();
    };

    (async () => {
      if (!channel.initialized) {
        try {
          await channel.watch();
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
        dispatch({ channel, type: 'initStateFromChannel' });
        if (channel.countUnread() > 0) markRead();
        // The more complex sync logic is done in Chat
        document.addEventListener('visibilitychange', onVisibilityChange);
        client.on('connection.changed', handleEvent);
        client.on('connection.recovered', handleEvent);
        client.on('user.updated', handleEvent);
        client.on('user.deleted', handleEvent);
        channel.on(handleEvent);
      }
    })();

    return () => {
      if (errored || !done) return;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      channel?.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.updated', handleEvent);
      client.off('user.deleted', handleEvent);
      notificationTimeouts.forEach(clearTimeout);
    };
  }, [channel.cid, doMarkReadRequest, channelConfig?.read_events]);

  useEffect(() => {
    if (!state.thread) return;

    const message = state.messages?.find((m) => m.id === state.thread?.id);

    if (message) dispatch({ message, type: 'setThread' });
  }, [state.messages, state.thread]);

  /** MESSAGE */

  // Adds a temporary notification to message list, will be removed after 5 seconds
  const addNotification = makeAddNotifications(setNotifications, notificationTimeouts);

  const loadMoreFinished = debounce(
    (hasMore: boolean, messages: ChannelState<StreamChatGenerics>['messages']) => {
      if (!isMounted.current) return;
      dispatch({ hasMore, messages, type: 'loadMoreFinished' });
    },
    2000,
    {
      leading: true,
      trailing: true,
    },
  );

  const loadMore = async (limit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE) => {
    if (!online.current || !window.navigator.onLine) return 0;

    // prevent duplicate loading events...
    const oldestMessage = state?.messages?.[0];

    if (state.loadingMore || state.loadingMoreNewer || oldestMessage?.status !== 'received') {
      return 0;
    }

    // initial state loads with up to 25 messages, so if less than 25 no need for additional query
    const notHasMore = hasNotMoreMessages(
      channel.state.messages.length,
      DEFAULT_INITIAL_CHANNEL_PAGE_SIZE,
    );
    if (notHasMore) {
      loadMoreFinished(false, channel.state.messages);
      return channel.state.messages.length;
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

    const hasMoreMessages = queryResponse.messages.length === perPage;
    loadMoreFinished(hasMoreMessages, channel.state.messages);

    return queryResponse.messages.length;
  };

  const loadMoreNewer = async (limit = 100) => {
    if (!online.current || !window.navigator.onLine) return 0;

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

    const hasMoreNewer = channel.state.messages !== channel.state.latestMessages;

    dispatch({ hasMoreNewer, messages: channel.state.messages, type: 'loadMoreNewerFinished' });
    return queryResponse.messages.length;
  };

  const clearHighlightedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToMessage = async (messageId: string, messageLimit = 100) => {
    dispatch({ loadingMore: true, type: 'setLoadingMore' });
    await channel.state.loadMessageIntoState(messageId, undefined, messageLimit);

    /**
     * if the message we are jumping to has less than half of the page size older messages,
     * we have jumped to the beginning of the channel.
     */
    const indexOfMessage = channel.state.messages.findIndex((message) => message.id === messageId);
    const hasMoreMessages = indexOfMessage >= Math.floor(messageLimit / 2);

    loadMoreFinished(hasMoreMessages, channel.state.messages);
    dispatch({
      hasMoreNewer: channel.state.messages !== channel.state.latestMessages,
      highlightedMessageId: messageId,
      type: 'jumpToMessageFinished',
    });

    if (clearHighlightedMessageTimeoutId.current) {
      clearTimeout(clearHighlightedMessageTimeoutId.current);
    }

    clearHighlightedMessageTimeoutId.current = setTimeout(() => {
      clearHighlightedMessageTimeoutId.current = null;
      dispatch({ type: 'clearHighlightedMessage' });
    }, 500);
  };

  const jumpToLatestMessage = async () => {
    await channel.state.loadMessageIntoState('latest');
    const hasMoreOlder = channel.state.messages.length >= 25;
    loadMoreFinished(hasMoreOlder, channel.state.messages);
    dispatch({
      type: 'jumpToLatestMessage',
    });
  };

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

  const isUserResponseArray = (
    output: string[] | UserResponse<StreamChatGenerics>[],
  ): output is UserResponse<StreamChatGenerics>[] =>
    (output as UserResponse<StreamChatGenerics>[])[0]?.id != null;

  const doSendMessage = async (
    message: MessageToSend<StreamChatGenerics> | StreamMessage<StreamChatGenerics>,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => {
    const { attachments, id, mentioned_users = [], parent_id, text } = message;

    // channel.sendMessage expects an array of user id strings
    const mentions = isUserResponseArray(mentioned_users)
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
        messageResponse = await doSendMessageRequest(channel.cid, messageData);
      } else {
        messageResponse = await channel.sendMessage(messageData);
      }

      let existingMessage;
      for (let i = channel.state.messages.length - 1; i >= 0; i--) {
        const msg = channel.state.messages[i];
        if (msg.id === messageData.id) {
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
      const parsedError = stringError ? JSON.parse(stringError) : {};

      updateMessage({
        ...message,
        error: parsedError,
        errorStatusCode: (parsedError.status as number) || undefined,
        status: 'failed',
      });
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
  ) => {
    channel.state.filterErrorMessages();

    const messagePreview = {
      __html: text,
      attachments,
      created_at: new Date(),
      html: text,
      id: customMessageData?.id ?? `${client.userID}-${nanoid()}`,
      mentioned_users,
      reactions: [],
      status: 'sending',
      text,
      type: 'regular',
      user: client.user,
      ...(parent?.id ? { parent_id: parent.id } : null),
    };

    updateMessage(messagePreview);

    await doSendMessage(messagePreview, customMessageData);
  };

  const retrySendMessage = async (message: StreamMessage<StreamChatGenerics>) => {
    updateMessage({
      ...message,
      errorStatusCode: undefined,
      status: 'sending',
    });

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

  const loadMoreThreadFinished = debounce(
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
  );

  const loadMoreThread = async (limit: number = DEFAULT_THREAD_PAGE_SIZE) => {
    if (state.threadLoadingMore || !state.thread) return;

    dispatch({ type: 'startLoadingThread' });
    const parentID = state.thread.id;

    if (!parentID) {
      return dispatch({ type: 'closeThread' });
    }

    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages[0]?.id;

    try {
      const queryResponse = await channel.getReplies(parentID, {
        id_lt: oldestMessageID,
        limit,
      });

      const threadHasMoreMessages = hasMoreMessagesProbably(queryResponse.messages.length, limit);
      const newThreadMessages = channel.state.threads[parentID] || [];

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
    dragAndDropWindow,
    giphyVersion: props.giphyVersion || 'fixed_height',
    imageAttachmentSizeHandler: props.imageAttachmentSizeHandler || getImageAttachmentConfiguration,
    maxNumberOfFiles,
    multipleUploads,
    mutes,
    notifications,
    quotedMessage,
    shouldGenerateVideoThumbnail: props.shouldGenerateVideoThumbnail || true,
    videoAttachmentSizeHandler: props.videoAttachmentSizeHandler || getVideoAttachmentConfiguration,
    watcher_count: state.watcherCount,
  });

  const channelActionContextValue: ChannelActionContextValue<StreamChatGenerics> = useMemo(
    () => ({
      addNotification,
      closeThread,
      dispatch,
      editMessage,
      jumpToLatestMessage,
      jumpToMessage,
      loadMore,
      loadMoreNewer,
      loadMoreThread,
      onMentionsClick: onMentionsHoverOrClick,
      onMentionsHover: onMentionsHoverOrClick,
      openThread,
      removeMessage,
      retrySendMessage,
      sendMessage,
      setQuotedMessage,
      skipMessageDataMemoization,
      updateMessage,
    }),
    [channel.cid, loadMore, loadMoreNewer, quotedMessage, jumpToMessage, jumpToLatestMessage],
  );

  const componentContextValue: ComponentContextValue<StreamChatGenerics> = useMemo(
    () => ({
      Attachment: props.Attachment || DefaultAttachment,
      AutocompleteSuggestionHeader: props.AutocompleteSuggestionHeader,
      AutocompleteSuggestionItem: props.AutocompleteSuggestionItem,
      AutocompleteSuggestionList: props.AutocompleteSuggestionList,
      Avatar: props.Avatar,
      CooldownTimer: props.CooldownTimer,
      DateSeparator: props.DateSeparator,
      EditMessageInput: props.EditMessageInput,
      EmojiIcon: props.EmojiIcon,
      EmptyStateIndicator: props.EmptyStateIndicator,
      FileUploadIcon: props.FileUploadIcon,
      GiphyPreviewMessage: props.GiphyPreviewMessage,
      HeaderComponent: props.HeaderComponent,
      Input: props.Input,
      LoadingIndicator: props.LoadingIndicator,
      Message: props.Message || MessageSimple,
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
      ReactionSelector: props.ReactionSelector,
      ReactionsList: props.ReactionsList,
      SendButton: props.SendButton,
      ThreadHead: props.ThreadHead,
      ThreadHeader: props.ThreadHeader,
      ThreadStart: props.ThreadStart,
      TriggerProvider: props.TriggerProvider,
      TypingIndicator: props.TypingIndicator,
      VirtualMessage: props.VirtualMessage,
    }),
    [],
  );

  const emojiContextValue: EmojiContextValue = useMemo(
    () => ({
      Emoji: props.Emoji,
      emojiConfig,
      EmojiIndex: props.EmojiIndex,
      EmojiPicker: props.EmojiPicker,
    }),
    [],
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
          <ComponentProvider value={componentContextValue}>
            <EmojiProvider value={emojiContextValue}>
              <TypingProvider value={typingContextValue}>
                <div className={`${chatContainerClass}`}>
                  {dragAndDropWindow && (
                    <DropzoneProvider {...optionalMessageInputProps}>{children}</DropzoneProvider>
                  )}
                  {!dragAndDropWindow && <>{children}</>}
                </div>
              </TypingProvider>
            </EmojiProvider>
          </ComponentProvider>
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
 * - [EmojiContext](https://getstream.io/chat/docs/sdk/react/contexts/emoji_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const Channel = React.memo(UnMemoizedChannel) as typeof UnMemoizedChannel;
