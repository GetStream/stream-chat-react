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
  MarkReadWrapperOptions,
  MessageToSend,
} from '../../context/ChannelActionContext';
import {
  ChannelNotifications,
  ChannelStateProvider,
  StreamMessage,
} from '../../context/ChannelStateContext';
import { ComponentContextValue, ComponentProvider } from '../../context/ComponentContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { TypingProvider } from '../../context/TypingContext';

import {
  DEFAULT_INITIAL_CHANNEL_PAGE_SIZE,
  DEFAULT_JUMP_TO_PAGE_SIZE,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
  DEFAULT_THREAD_PAGE_SIZE,
} from '../../constants/limits';

import type { UnreadMessagesNotificationProps } from '../MessageList';
import { hasMoreMessagesProbably, UnreadMessagesSeparator } from '../MessageList';
import { useChannelContainerClasses } from './hooks/useChannelContainerClasses';
import { findInMsgSetByDate, findInMsgSetById, makeAddNotifications } from './utils';
import { getChannel } from '../../utils';

import type { MessageProps } from '../Message/types';
import type { MessageInputProps } from '../MessageInput/MessageInput';

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
import { defaultReactionOptions, ReactionOptions } from '../Reactions';
import { EventComponent } from '../EventComponent';
import { DateSeparator } from '../DateSeparator';

type ChannelPropsForwardedToComponentContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Custom UI component to display a message attachment, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Attachment.tsx) */
  Attachment?: ComponentContextValue<StreamChatGenerics>['Attachment'];
  /** Custom UI component to display an attachment previews in MessageInput, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AttachmentPreviewList.tsx) */
  AttachmentPreviewList?: ComponentContextValue<StreamChatGenerics>['AttachmentPreviewList'];
  /** Custom UI component to display AudioRecorder in MessageInput, defaults to and accepts same props as: [AudioRecorder](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/AudioRecorder.tsx) */
  AudioRecorder?: ComponentContextValue<StreamChatGenerics>['AudioRecorder'];
  /** Optional UI component to override the default suggestion Item component, defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js) */
  AutocompleteSuggestionItem?: ComponentContextValue<StreamChatGenerics>['AutocompleteSuggestionItem'];
  /** Optional UI component to override the default List component that displays suggestions, defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js) */
  AutocompleteSuggestionList?: ComponentContextValue<StreamChatGenerics>['AutocompleteSuggestionList'];
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: ComponentContextValue<StreamChatGenerics>['Avatar'];
  /** Custom UI component to display <img/> elements resp. a fallback in case of load error, defaults to and accepts same props as: [BaseImage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/BaseImage.tsx) */
  BaseImage?: ComponentContextValue<StreamChatGenerics>['BaseImage'];
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/CooldownTimer.tsx) */
  CooldownTimer?: ComponentContextValue<StreamChatGenerics>['CooldownTimer'];
  /** Custom UI component to render set of buttons to be displayed in the MessageActionsBox, defaults to and accepts same props as: [CustomMessageActionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageActions/CustomMessageActionsList.tsx) */
  CustomMessageActionsList?: ComponentContextValue<StreamChatGenerics>['CustomMessageActionsList'];
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: ComponentContextValue<StreamChatGenerics>['DateSeparator'];
  /** Custom UI component to override default edit message input, defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx) */
  EditMessageInput?: ComponentContextValue<StreamChatGenerics>['EditMessageInput'];
  /** Custom UI component for rendering button with emoji picker in MessageInput */
  EmojiPicker?: ComponentContextValue<StreamChatGenerics>['EmojiPicker'];
  /** Mechanism to be used with autocomplete and text replace features of the `MessageInput` component, see [emoji-mart `SearchIndex`](https://github.com/missive/emoji-mart#%EF%B8%8F%EF%B8%8F-headless-search) */
  emojiSearchIndex?: ComponentContextValue<StreamChatGenerics>['emojiSearchIndex'];
  /** Custom UI component to be displayed when the `MessageList` is empty, defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx)  */
  EmptyStateIndicator?: ComponentContextValue<StreamChatGenerics>['EmptyStateIndicator'];
  /** Custom UI component for file upload icon, defaults to and accepts same props as: [FileUploadIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  FileUploadIcon?: ComponentContextValue<StreamChatGenerics>['FileUploadIcon'];
  /** Custom UI component to render a Giphy preview in the `VirtualizedMessageList` */
  GiphyPreviewMessage?: ComponentContextValue<StreamChatGenerics>['GiphyPreviewMessage'];
  /** Custom UI component to render at the top of the `MessageList` */
  HeaderComponent?: ComponentContextValue<StreamChatGenerics>['HeaderComponent'];
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: ComponentContextValue<StreamChatGenerics>['Input'];
  /** Custom component to render link previews in message input **/
  LinkPreviewList?: ComponentContextValue<StreamChatGenerics>['LinkPreviewList'];
  /** Custom UI component to be shown if the channel query fails, defaults to and accepts same props as: [LoadingErrorIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingErrorIndicator.tsx) */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to render while the `MessageList` is loading new messages, defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingIndicator.tsx) */
  LoadingIndicator?: ComponentContextValue<StreamChatGenerics>['LoadingIndicator'];
  /** Custom UI component to display a message in the standard `MessageList`, defaults to and accepts the same props as: [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: ComponentContextValue<StreamChatGenerics>['Message'];
  /** Custom UI component to display the contents of a bounced message modal. Usually it allows to retry, edit, or delete the message. Defaults to and accepts the same props as: [MessageBouncePrompt](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageBounce/MessageBouncePrompt.tsx) */
  MessageBouncePrompt?: ComponentContextValue<StreamChatGenerics>['MessageBouncePrompt'];
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
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx) */
  PinIndicator?: ComponentContextValue<StreamChatGenerics>['PinIndicator'];
  /** Custom UI component to override quoted message UI on a sent message, defaults to and accepts same props as: [QuotedMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/QuotedMessage.tsx) */
  QuotedMessage?: ComponentContextValue<StreamChatGenerics>['QuotedMessage'];
  /** Custom UI component to override the message input's quoted message preview, defaults to and accepts same props as: [QuotedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/QuotedMessagePreview.tsx) */
  QuotedMessagePreview?: ComponentContextValue<StreamChatGenerics>['QuotedMessagePreview'];
  /** Custom reaction options to be applied to ReactionSelector, ReactionList and SimpleReactionList components */
  reactionOptions?: ReactionOptions;
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: ComponentContextValue<StreamChatGenerics>['ReactionSelector'];
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: ComponentContextValue<StreamChatGenerics>['ReactionsList'];
  /** Custom UI component for send button, defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  SendButton?: ComponentContextValue<StreamChatGenerics>['SendButton'];
  /** Custom UI component button for initiating audio recording, defaults to and accepts same props as: [StartRecordingAudioButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MediaRecorder/AudioRecorder/AudioRecordingButtons.tsx) */
  StartRecordingAudioButton?: ComponentContextValue<StreamChatGenerics>['StartRecordingAudioButton'];
  /** Custom UI component that displays thread's parent or other message at the top of the `MessageList`, defaults to and accepts same props as [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  ThreadHead?: React.ComponentType<MessageProps<StreamChatGenerics>>;
  /** Custom UI component to display the header of a `Thread`, defaults to and accepts same props as: [DefaultThreadHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadHeader?: ComponentContextValue<StreamChatGenerics>['ThreadHeader'];
  /** Custom UI component to display the start of a threaded `MessageList`, defaults to and accepts same props as: [DefaultThreadStart](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadStart?: ComponentContextValue<StreamChatGenerics>['ThreadStart'];
  /** Custom UI component to display a date used in timestamps. It's used internally by the default `MessageTimestamp`, and to display a timestamp for edited messages. */
  Timestamp?: ComponentContextValue<StreamChatGenerics>['Timestamp'];
  /** Optional context provider that lets you override the default autocomplete triggers, defaults to: [DefaultTriggerProvider](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/DefaultTriggerProvider.tsx) */
  TriggerProvider?: ComponentContextValue<StreamChatGenerics>['TriggerProvider'];
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: ComponentContextValue<StreamChatGenerics>['TypingIndicator'];
  /** Custom UI component that indicates a user is viewing unread messages. It disappears once the user scrolls to UnreadMessagesSeparator. Defaults to and accepts same props as: [UnreadMessagesNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesNotification.tsx) */
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  /** Custom UI component that separates read messages from unread, defaults to and accepts same props as: [UnreadMessagesSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/UnreadMessagesSeparator.tsx) */
  UnreadMessagesSeparator?: ComponentContextValue<StreamChatGenerics>['UnreadMessagesSeparator'];
  /** Custom UI component to display a message in the `VirtualizedMessageList`, does not have a default implementation */
  VirtualMessage?: ComponentContextValue<StreamChatGenerics>['VirtualMessage'];
};

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

  const [channelConfig, setChannelConfig] = useState(channel.getConfig());
  const [notifications, setNotifications] = useState<ChannelNotifications>([]);
  const [quotedMessage, setQuotedMessage] = useState<StreamMessage<StreamChatGenerics>>();
  const [channelUnreadUiState, _setChannelUnreadUiState] = useState<ChannelUnreadUiState>();

  const notificationTimeouts: Array<NodeJS.Timeout> = [];

  const [state, dispatch] = useReducer<ChannelStateReducer<StreamChatGenerics>>(
    channelReducer,
    // channel.initialized === false if client.channel().query() was not called, e.g. ChannelList is not used
    // => Channel will call channel.watch() in useLayoutEffect => state.loading is used to signal the watch() call state
    { ...initialState, loading: !channel.initialized },
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
    let channelInitializedExternally = true;

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
          channelInitializedExternally = false;
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
          hasMore:
            channelInitializedExternally ||
            hasMoreMessagesProbably(
              channel.state.messages.length,
              channelQueryOptions.messages.limit,
            ),
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

    return () => {
      if (errored || !done) return;
      channel?.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.updated', handleEvent);
      client.off('user.deleted', handleEvent);
      notificationTimeouts.forEach(clearTimeout);
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
  const addNotification = makeAddNotifications(setNotifications, notificationTimeouts);

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
    if (!online.current || !window.navigator.onLine || !state.hasMore) return 0;

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

    const hasMoreMessages = queryResponse.messages.length === perPage;
    loadMoreFinished(hasMoreMessages, channel.state.messages);

    return queryResponse.messages.length;
  };

  const loadMoreNewer = async (limit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE) => {
    if (!online.current || !window.navigator.onLine || !state.hasMoreNewer) return 0;

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

    const hasMoreNewerMessages = channel.state.messages !== channel.state.latestMessages;

    dispatch({
      hasMoreNewer: hasMoreNewerMessages,
      messages: channel.state.messages,
      type: 'loadMoreNewerFinished',
    });
    return queryResponse.messages.length;
  };

  const clearHighlightedMessageTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpToMessage = async (messageId: string, messageLimit = DEFAULT_JUMP_TO_PAGE_SIZE) => {
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
    // FIXME: we cannot rely on constant value 25 as the page size can be customized by integrators
    const hasMoreOlder = channel.state.messages.length >= 25;
    loadMoreFinished(hasMoreOlder, channel.state.messages);
    dispatch({
      type: 'jumpToLatestMessage',
    });
  };

  const jumpToFirstUnreadMessage = useCallback(
    async (queryMessageLimit = DEFAULT_JUMP_TO_PAGE_SIZE) => {
      if (!channelUnreadUiState?.unread_messages) return;
      let lastReadMessageId = channelUnreadUiState?.last_read_message_id;
      let firstUnreadMessageId = channelUnreadUiState?.first_unread_message_id;
      let isInCurrentMessageSet = false;
      let hasMoreMessages = true;

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
            loadMoreFinished(hasMoreMessages, channel.state.messages);
            return;
          }

          const firstMessageWithCreationDate = messages.find((msg) => msg.created_at);
          if (!firstMessageWithCreationDate) {
            addNotification(t('Failed to jump to the first unread message'), 'error');
            loadMoreFinished(hasMoreMessages, channel.state.messages);
            return;
          }
          const firstMessageTimestamp = new Date(
            firstMessageWithCreationDate.created_at as string,
          ).getTime();
          if (lastReadTimestamp < firstMessageTimestamp) {
            // whole channel is unread
            firstUnreadMessageId = firstMessageWithCreationDate.id;
            hasMoreMessages = false;
          } else {
            const result = findInMsgSetByDate(channelUnreadUiState.last_read, messages);
            lastReadMessageId = result.target?.id;
            hasMoreMessages = result.index >= Math.floor(queryMessageLimit / 2);
          }
          loadMoreFinished(hasMoreMessages, channel.state.messages);
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
          hasMoreMessages = indexOfTarget >= Math.floor(queryMessageLimit / 2);
          loadMoreFinished(hasMoreMessages, channel.state.messages);
          firstUnreadMessageId =
            firstUnreadMessageId ?? channel.state.messages[indexOfTarget + 1]?.id;
        } catch (e) {
          addNotification(t('Failed to jump to the first unread message'), 'error');
          loadMoreFinished(hasMoreMessages, channel.state.messages);
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
        hasMoreNewer: channel.state.messages !== channel.state.latestMessages,
        highlightedMessageId: firstUnreadMessageId,
        type: 'jumpToMessageFinished',
      });

      if (clearHighlightedMessageTimeoutId.current) {
        clearTimeout(clearHighlightedMessageTimeoutId.current);
      }

      clearHighlightedMessageTimeoutId.current = setTimeout(() => {
        clearHighlightedMessageTimeoutId.current = null;
        dispatch({ type: 'clearHighlightedMessage' });
      }, 500);
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

  const componentContextValue: ComponentContextValue<StreamChatGenerics> = useMemo(
    () => ({
      Attachment: props.Attachment || DefaultAttachment,
      AttachmentPreviewList: props.AttachmentPreviewList,
      AudioRecorder: props.AudioRecorder,
      AutocompleteSuggestionItem: props.AutocompleteSuggestionItem,
      AutocompleteSuggestionList: props.AutocompleteSuggestionList,
      Avatar: props.Avatar,
      BaseImage: props.BaseImage,
      CooldownTimer: props.CooldownTimer,
      CustomMessageActionsList: props.CustomMessageActionsList,
      DateSeparator: props.DateSeparator || DateSeparator,
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
      Message: props.Message || MessageSimple,
      MessageBouncePrompt: props.MessageBouncePrompt,
      MessageDeleted: props.MessageDeleted,
      MessageListNotifications: props.MessageListNotifications,
      MessageNotification: props.MessageNotification,
      MessageOptions: props.MessageOptions,
      MessageRepliesCountButton: props.MessageRepliesCountButton,
      MessageStatus: props.MessageStatus,
      MessageSystem: props.MessageSystem || EventComponent,
      MessageTimestamp: props.MessageTimestamp,
      ModalGallery: props.ModalGallery,
      PinIndicator: props.PinIndicator,
      QuotedMessage: props.QuotedMessage,
      QuotedMessagePreview: props.QuotedMessagePreview,
      reactionOptions: props.reactionOptions ?? defaultReactionOptions,
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
      UnreadMessagesSeparator: props.UnreadMessagesSeparator || UnreadMessagesSeparator,
      VirtualMessage: props.VirtualMessage,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.reactionOptions],
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
            <TypingProvider value={typingContextValue}>
              <div className={`${chatContainerClass}`}>
                {dragAndDropWindow && (
                  <DropzoneProvider {...optionalMessageInputProps}>{children}</DropzoneProvider>
                )}
                {!dragAndDropWindow && <>{children}</>}
              </div>
            </TypingProvider>
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
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const Channel = React.memo(UnMemoizedChannel) as typeof UnMemoizedChannel;
