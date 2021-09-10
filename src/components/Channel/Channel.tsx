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
import { v4 as uuidv4 } from 'uuid';

import { channelReducer, ChannelStateReducer, initialState } from './channelState';
import { commonEmoji, defaultMinimalEmojis, emojiSetDef } from './emojiData';
import { useEditMessageHandler } from './hooks/useEditMessageHandler';
import { useIsMounted } from './hooks/useIsMounted';
import { OnMentionAction, useMentionsHandlers } from './hooks/useMentionsHandlers';

import { Attachment as DefaultAttachment } from '../Attachment/Attachment';
import {
  LoadingErrorIndicator as DefaultLoadingErrorIndicator,
  LoadingIndicator as DefaultLoadingIndicator,
  LoadingErrorIndicatorProps,
} from '../Loading';
import { MessageSimple } from '../Message/MessageSimple';

import {
  ChannelActionContextValue,
  ChannelActionProvider,
  MessageAttachments,
  MessageToSend,
} from '../../context/ChannelActionContext';
import {
  ChannelNotifications,
  ChannelStateContextValue,
  ChannelStateProvider,
  StreamMessage,
} from '../../context/ChannelStateContext';
import { ComponentContextValue, ComponentProvider } from '../../context/ComponentContext';
import { useChatContext } from '../../context/ChatContext';
import { EmojiConfig, EmojiContextValue, EmojiProvider } from '../../context/EmojiContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { TypingContextValue, TypingProvider } from '../../context/TypingContext';
import defaultEmojiData from '../../stream-emoji.json';

import type { Data as EmojiMartData } from 'emoji-mart';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** List of accepted file types */
  acceptedFiles?: string[];
  /** Custom UI component to display a message attachment, defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Attachment.tsx) */
  Attachment?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Attachment'];
  /** Optional UI component to override the default suggestion Header component, defaults to and accepts same props as: [Header](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Header.tsx) */
  AutocompleteSuggestionHeader?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['AutocompleteSuggestionHeader'];
  /** Optional UI component to override the default suggestion Item component, defaults to and accepts same props as: [Item](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/Item.js) */
  AutocompleteSuggestionItem?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['AutocompleteSuggestionItem'];
  /** Optional UI component to override the default List component that displays suggestions, defaults to and accepts same props as: [List](https://github.com/GetStream/stream-chat-react/blob/master/src/components/AutoCompleteTextarea/List.js) */
  AutocompleteSuggestionList?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['AutocompleteSuggestionList'];
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Avatar'];
  /** The connected and active channel */
  channel?: StreamChannel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Custom UI component to display the slow mode cooldown timer, defaults to and accepts same props as: [CooldownTimer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/hooks/useCooldownTimer.tsx) */
  CooldownTimer?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['CooldownTimer'];
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['DateSeparator'];
  /** Custom action handler to override the default `channel.markRead` request function (advanced usage only) */
  doMarkReadRequest?: (
    channel: StreamChannel<At, Ch, Co, Ev, Me, Re, Us>,
  ) => Promise<MessageResponse<At, Ch, Co, Me, Re, Us>> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function (advanced usage only) */
  doSendMessageRequest?: (
    channelId: string,
    message: Message<At, Me, Us>,
  ) => ReturnType<StreamChannel<At, Ch, Co, Ev, Me, Re, Us>['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function (advanced usage only) */
  doUpdateMessageRequest?: (
    cid: string,
    updatedMessage: UpdatedMessage<At, Ch, Co, Me, Re, Us>,
  ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
  /** Custom UI component to override default edit message input, defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx) */
  EditMessageInput?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['EditMessageInput'];
  /** Custom UI component to override default `NimbleEmoji` from `emoji-mart` */
  Emoji?: EmojiContextValue['Emoji'];
  /** Custom prop to override default `facebook.json` emoji data set from `emoji-mart` */
  emojiData?: EmojiMartData;
  /** Custom UI component for emoji button in input, defaults to and accepts same props as: [EmojiIconSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  EmojiIcon?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['EmojiIcon'];
  /** Custom UI component to override default `NimbleEmojiIndex` from `emoji-mart` */
  EmojiIndex?: EmojiContextValue['EmojiIndex'];
  /** Custom UI component to override default `NimblePicker` from `emoji-mart` */
  EmojiPicker?: EmojiContextValue['EmojiPicker'];
  /** Custom UI component to be shown if no active channel is set, defaults to null and skips rendering the Channel component */
  EmptyPlaceholder?: React.ReactElement;
  /** Custom UI component to be displayed when the `MessageList` is empty, , defaults to and accepts same props as: [EmptyStateIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EmptyStateIndicator/EmptyStateIndicator.tsx)  */
  EmptyStateIndicator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['EmptyStateIndicator'];
  /** Custom UI component for file upload icon, defaults to and accepts same props as: [FileUploadIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  FileUploadIcon?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['FileUploadIcon'];
  /** Custom UI component to render a Giphy preview in the `VirtualizedMessageList` */
  GiphyPreviewMessage?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['GiphyPreviewMessage'];
  /** Custom UI component to render at the top of the `MessageList` */
  HeaderComponent?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['HeaderComponent'];
  /** Custom UI component handling how the message input is rendered, defaults to and accepts the same props as [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputFlat.tsx) */
  Input?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Input'];
  /** Custom UI component to be shown if the channel query fails, defaults to and accepts same props as: [LoadingErrorIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingErrorIndicator.tsx) */
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorIndicatorProps>;
  /** Custom UI component to render while the `MessageList` is loading new messages, defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Loading/LoadingIndicator.tsx) */
  LoadingIndicator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['LoadingIndicator'];
  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles?: number;
  /** Custom UI component to display a message in the standard `MessageList`, defaults to and accepts the same props as: [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Message'];
  /** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx) */
  MessageDeleted?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageDeleted'];
  /** Custom UI component that displays message and connection status notifications in the `MessageList`, defaults to and accepts same props as [DefaultMessageListNotifications](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageList.tsx) */
  MessageListNotifications?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['MessageListNotifications'];
  /** Custom UI component to display a notification when scrolled up the list and new messages arrive, defaults to and accepts same props as [MessageNotification](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageList/MessageNotification.tsx) */
  MessageNotification?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageNotification'];
  /** Custom UI component for message options popup, defaults to and accepts same props as: [MessageOptions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageOptions.tsx) */
  MessageOptions?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageOptions'];
  /** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx) */
  MessageRepliesCountButton?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['MessageRepliesCountButton'];
  /** Custom UI component to display message delivery status, defaults to and accepts same props as: [MessageStatus](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageStatus.tsx) */
  MessageStatus?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageStatus'];
  /** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent/EventComponent.tsx) */
  MessageSystem?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageSystem'];
  /** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx) */
  MessageTimestamp?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageTimestamp'];
  /** Whether to allow multiple attachment uploads */
  multipleUploads?: boolean;
  /** Custom action handler function to run on click of an @mention in a message */
  onMentionsClick?: OnMentionAction<Us>;
  /** Custom action handler function to run on hover of an @mention in a message */
  onMentionsHover?: OnMentionAction<Us>;
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx) */
  PinIndicator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['PinIndicator'];
  /** Custom UI component to override quoted message UI on a sent message, defaults to and accepts same props as: [QuotedMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/QuotedMessage.tsx) */
  QuotedMessage?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['QuotedMessage'];
  /** Custom UI component to override the message input's quoted message preview, defaults to and accepts same props as: [QuotedMessagePreview](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/QuotedMessagePreview.tsx) */
  QuotedMessagePreview?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['QuotedMessagePreview'];
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ReactionSelector'];
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ReactionsList'];
  /** Custom UI component for send button, defaults to and accepts same props as: [SendButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.tsx) */
  SendButton?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['SendButton'];
  /** Custom UI component to display the header of a `Thread`, defaults to and accepts same props as: [DefaultThreadHeader](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadHeader?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ThreadHeader'];
  /** Custom UI component to display the start of a threaded `MessageList`, defaults to and accepts same props as: [DefaultThreadStart](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Thread/Thread.tsx) */
  ThreadStart?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ThreadStart'];
  /** Optional context provider that lets you override the default autocomplete triggers, defaults to: [DefaultTriggerProvider](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/DefaultTriggerProvider.tsx) */
  TriggerProvider?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['TriggerProvider'];
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['TypingIndicator'];
  /** Custom UI component to display a message in the `VirtualizedMessageList`, defaults to and accepts same props as: [FixedHeightMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/FixedHeightMessage.tsx) */
  VirtualMessage?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['VirtualMessage'];
};

const UnMemoizedChannel = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: PropsWithChildren<ChannelProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { channel: propsChannel, EmptyPlaceholder = null } = props;

  const { channel: contextChannel } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const channel = propsChannel || contextChannel;

  if (!channel?.cid) return EmptyPlaceholder;

  return <ChannelInner {...props} channel={channel} key={channel.cid} />;
};

const ChannelInner = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: PropsWithChildren<
    ChannelProps<At, Ch, Co, Ev, Me, Re, Us> & {
      channel: StreamChannel<At, Ch, Co, Ev, Me, Re, Us>;
      key: string;
    }
  >,
) => {
  const {
    acceptedFiles,
    channel,
    children,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    emojiData = defaultEmojiData,
    LoadingErrorIndicator = DefaultLoadingErrorIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    maxNumberOfFiles,
    multipleUploads = true,
    onMentionsClick,
    onMentionsHover,
  } = props;

  const { client, customClasses, mutes, theme, useImageFlagEmojisOnWindows } = useChatContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  const [notifications, setNotifications] = useState<ChannelNotifications>([]);
  const [quotedMessage, setQuotedMessage] = useState<StreamMessage<At, Ch, Co, Ev, Me, Re, Us>>();

  const notificationTimeouts: Array<NodeJS.Timeout> = [];

  const [state, dispatch] = useReducer<ChannelStateReducer<At, Ch, Co, Ev, Me, Re, Us>>(
    channelReducer,
    initialState,
  );

  const isMounted = useIsMounted();

  const originalTitle = useRef('');
  const lastRead = useRef(new Date());
  const online = useRef(true);

  const channelConfig = channel.getConfig();
  const emojiConfig: EmojiConfig = {
    commonEmoji,
    defaultMinimalEmojis,
    emojiData,
    emojiSetDef,
  };

  const throttledCopyStateFromChannel = useCallback(
    throttle(
      () => {
        if (!channel) return;
        dispatch({ channel, type: 'copyStateFromChannelOnEvent' });
      },
      500,
      { leading: true, trailing: true },
    ),
    [channel],
  );

  const markRead = useCallback(() => {
    if (!channel || channel.disconnected || !channel.getConfig()?.read_events) {
      return;
    }

    lastRead.current = new Date();

    if (doMarkReadRequest) {
      doMarkReadRequest(channel);
    } else {
      logChatPromiseExecution(channel.markRead(), 'mark read');
    }

    if (originalTitle.current) {
      document.title = originalTitle.current;
    }
  }, [channel, doMarkReadRequest]);

  const markReadThrottled = useCallback(
    throttle(markRead, 500, { leading: true, trailing: true }),
    [markRead],
  );

  const handleEvent = useCallback(
    (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.message) {
        dispatch({
          channel,
          message: event.message,
          type: 'updateThreadOnEvent',
        });
      }

      if (event.type === 'typing.start' || event.type === 'typing.stop') {
        dispatch({
          channel,
          type: 'setTyping',
        });
        return;
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
          } else if (channel.getConfig()?.read_events && !channel.muteStatus().muted) {
            const unread = channel.countUnread(lastRead.current);
            document.title = `(${unread}) ${originalTitle.current}`;
          }
        }
      }

      throttledCopyStateFromChannel();
    },
    [channel, client.userID, markReadThrottled, throttledCopyStateFromChannel],
  );

  // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release
  useLayoutEffect(() => {
    let errored = false;
    let done = false;

    const onVisibilityChange = () => {
      if (!document.hidden) {
        markRead();
      }
    };

    (async () => {
      if (channel && !channel.initialized) {
        try {
          await channel.watch();
        } catch (e) {
          dispatch({ error: e as Error, type: 'setError' });
          errored = true;
        }
      }

      done = true;
      originalTitle.current = document.title;

      if (channel && !errored) {
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
      if (channel) channel.off(handleEvent);
      client.off('connection.changed', handleEvent);
      client.off('connection.recovered', handleEvent);
      client.off('user.updated', handleEvent);
      client.off('user.deleted', handleEvent);
      notificationTimeouts.forEach(clearTimeout);
    };
  }, [channel, client, handleEvent, markRead]);

  useEffect(() => {
    if (state.thread && state.messages?.length) {
      for (let i = state.messages.length - 1; i >= 0; i -= 1) {
        if (state.messages[i].id === state.thread.id) {
          dispatch({ message: state.messages[i], type: 'setThread' });
          break;
        }
      }
    }
  }, [state.messages, state.thread]);

  /** MESSAGE */

  // Adds a temporary notification to message list, will be removed after 5 seconds
  const addNotification = (text: string, type: 'success' | 'error') => {
    if (typeof text !== 'string' || (type !== 'success' && type !== 'error')) {
      return;
    }

    const id = uuidv4();

    setNotifications((prevNotifications) => [...prevNotifications, { id, text, type }]);

    const timeout = setTimeout(
      () =>
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notification) => notification.id !== id),
        ),
      5000,
    );

    notificationTimeouts.push(timeout);
  };

  const loadMoreFinished = useCallback(
    debounce(
      (hasMore: boolean, messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages']) => {
        if (!isMounted.current) return;
        dispatch({ hasMore, messages, type: 'loadMoreFinished' });
      },
      2000,
      {
        leading: true,
        trailing: true,
      },
    ),
    [],
  );

  const loadMore = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    async (limit: number = 100) => {
      if (!online.current || !window.navigator.onLine || !channel) return 0;

      // prevent duplicate loading events...
      const oldestMessage = state?.messages?.[0];

      if (state.loadingMore || oldestMessage?.status !== 'received') return 0;

      // initial state loads with up to 25 messages, so if less than 25 no need for additional query
      if (channel.state.messages.length < 25) {
        loadMoreFinished(false, channel.state.messages);
        return channel.state.messages.length;
      }

      dispatch({ loadingMore: true, type: 'setLoadingMore' });

      const oldestID = oldestMessage?.id;
      const perPage = limit;
      let queryResponse: ChannelAPIResponse<At, Ch, Co, Me, Re, Us>;

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
    },
    [channel, loadMoreFinished, online, state.loadingMore, state.messages],
  );

  const updateMessage = useCallback(
    (
      updatedMessage:
        | MessageToSend<At, Ch, Co, Ev, Me, Re, Us>
        | StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    ) => {
      if (!channel) return;
      // adds the message to the local channel state..
      // this adds to both the main channel state as well as any reply threads
      channel.state.addMessageSorted(
        updatedMessage as MessageResponse<At, Ch, Co, Me, Re, Us>,
        true,
      );

      dispatch({
        channel,
        parentId: state.thread && updatedMessage.parent_id,
        type: 'copyMessagesFromChannel',
      });
    },
    [channel, state.thread],
  );

  const isUserResponseArray = (
    output: string[] | UserResponse<Us>[],
  ): output is UserResponse<Us>[] => (output as UserResponse<Us>[])[0]?.id != null;

  const doSendMessage = useCallback(
    async (
      message:
        | MessageToSend<At, Ch, Co, Ev, Me, Re, Us>
        | StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
      customMessageData?: Partial<Message<At, Me, Us>>,
    ) => {
      if (!channel) return;

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
        quoted_message_id: quotedMessage?.id,
        text,
        ...customMessageData,
      } as Message<At, Me, Us>;

      try {
        let messageResponse: void | SendMessageAPIResponse<At, Ch, Co, Me, Re, Us>;

        if (doSendMessageRequest) {
          messageResponse = await doSendMessageRequest(channel.cid, messageData);
        } else {
          messageResponse = await channel.sendMessage(messageData);
        }

        // replace it after send is completed
        if (messageResponse && messageResponse.message) {
          updateMessage({
            ...messageResponse.message,
            status: 'received',
          });
        }

        if (quotedMessage) setQuotedMessage(undefined);
      } catch (error) {
        // error response isn't usable so needs to be stringified then parsed
        const stringError = JSON.stringify(error);
        const parsedError = stringError ? JSON.parse(stringError) : {};

        updateMessage({
          ...message,
          errorStatusCode: (parsedError.status as number) || undefined,
          status: 'failed',
        });
      }
    },
    [channel, doSendMessageRequest, quotedMessage, updateMessage],
  );

  const createMessagePreview = useCallback(
    (
      text: string,
      attachments: MessageAttachments<At>,
      parent: StreamMessage<At, Ch, Co, Ev, Me, Re, Us> | undefined,
      mentioned_users: UserResponse<Us>[],
    ) => {
      // create a preview of the message
      const clientSideID = `${client.userID}-${uuidv4()}`;

      return ({
        __html: text,
        attachments,
        created_at: new Date(),
        html: text,
        id: clientSideID,
        mentioned_users,
        reactions: [],
        status: 'sending',
        text,
        type: 'regular',
        user: client.user,
        ...(parent?.id ? { parent_id: parent.id } : null),
      } as unknown) as MessageResponse<At, Ch, Co, Me, Re, Us>;
    },
    [client.user, client.userID],
  );

  const sendMessage = useCallback(
    async (
      {
        attachments = [],
        mentioned_users = [],
        parent = undefined,
        text = '',
      }: MessageToSend<At, Ch, Co, Ev, Me, Re, Us>,
      customMessageData?: Partial<Message<At, Me, Us>>,
    ) => {
      if (!channel) return;

      // remove error messages upon submit
      channel.state.filterErrorMessages();

      // create a local preview message to show in the UI
      const messagePreview = createMessagePreview(text, attachments, parent, mentioned_users);

      // first we add the message to the UI
      updateMessage(messagePreview);

      await doSendMessage(messagePreview, customMessageData);
    },
    [channel?.state, createMessagePreview, doSendMessage, updateMessage],
  );

  const retrySendMessage = useCallback(
    async (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => {
      // set the message status to sending
      updateMessage({
        ...message,
        errorStatusCode: undefined,
        status: 'sending',
      });

      // actually try to send the message...
      await doSendMessage(message);
    },
    [doSendMessage, updateMessage],
  );

  const removeMessage = useCallback(
    (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (!channel) return;

      channel.state.removeMessage(message);

      dispatch({
        channel,
        parentId: state.thread && message.parent_id,
        type: 'copyMessagesFromChannel',
      });
    },
    [channel, state.thread],
  );

  /** THREAD */

  const openThread = useCallback(
    (message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>, event: React.BaseSyntheticEvent) => {
      if (!channel) return;

      if (event && event.preventDefault) {
        event.preventDefault();
      }

      dispatch({ channel, message, type: 'openThread' });
    },
    [channel],
  );

  const loadMoreThreadFinished = useCallback(
    debounce(
      (
        threadHasMore: boolean,
        threadMessages: Array<
          ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
        >,
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

  const loadMoreThread = useCallback(async () => {
    // prevent duplicate loading events...
    if (!channel || state.threadLoadingMore || !state.thread) return;

    dispatch({ type: 'startLoadingThread' });
    const parentID = state.thread.id;

    if (!parentID) {
      dispatch({ type: 'closeThread' });
      return;
    }

    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages[0]?.id;
    const limit = 50;

    try {
      const queryResponse = await channel.getReplies(parentID, {
        id_lt: oldestMessageID,
        limit,
      });

      const threadHasMoreMessages = queryResponse.messages.length === limit;
      const newThreadMessages = channel.state.threads[parentID] || [];

      // next set loadingMore to false so we can start asking for more data...
      loadMoreThreadFinished(threadHasMoreMessages, newThreadMessages);
    } catch (e) {
      loadMoreThreadFinished(false, oldMessages);
    }
  }, [channel, loadMoreThreadFinished, state.thread, state.threadLoadingMore]);

  const closeThread = useCallback((event: React.BaseSyntheticEvent) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    dispatch({ type: 'closeThread' });
  }, []);

  const onMentionsHoverOrClick = useMentionsHandlers(onMentionsHover, onMentionsClick);

  const editMessage = useEditMessageHandler(doUpdateMessageRequest);

  const { typing, ...restState } = state;

  const channelStateContextValue: ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
    ...restState,
    acceptedFiles,
    channel,
    channelConfig,
    maxNumberOfFiles,
    multipleUploads,
    mutes,
    notifications,
    quotedMessage,
    watcher_count: state.watcherCount,
  };

  const channelActionContextValue: ChannelActionContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
    addNotification,
    closeThread,
    dispatch,
    editMessage,
    loadMore,
    loadMoreThread,
    onMentionsClick: onMentionsHoverOrClick,
    onMentionsHover: onMentionsHoverOrClick,
    openThread,
    removeMessage,
    retrySendMessage,
    sendMessage,
    setQuotedMessage,
    updateMessage,
  };

  const componentContextValue: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
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
      PinIndicator: props.PinIndicator,
      QuotedMessage: props.QuotedMessage,
      QuotedMessagePreview: props.QuotedMessagePreview,
      ReactionSelector: props.ReactionSelector,
      ReactionsList: props.ReactionsList,
      SendButton: props.SendButton,
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

  const typingContextValue: TypingContextValue<At, Ch, Co, Ev, Me, Re, Us> = {
    typing,
  };

  const chatClass = customClasses?.chat || 'str-chat';
  const channelClass = customClasses?.channel || 'str-chat-channel';
  const windowsEmojiClass =
    useImageFlagEmojisOnWindows && navigator.userAgent.match(/Win/)
      ? ' str-chat--windows-flags'
      : '';

  if (state.error) {
    return (
      <div className={`${chatClass} ${channelClass} ${theme}`}>
        <LoadingErrorIndicator error={state.error} />
      </div>
    );
  }

  if (state.loading) {
    return (
      <div className={`${chatClass} ${channelClass} ${theme}`}>
        <LoadingIndicator size={25} />
      </div>
    );
  }

  if (!channel?.watch) {
    return (
      <div className={`${chatClass} ${channelClass} ${theme}`}>
        <div>{t('Channel Missing')}</div>
      </div>
    );
  }

  return (
    <div className={`${chatClass} ${channelClass} ${theme} ${windowsEmojiClass}`}>
      <ChannelStateProvider value={channelStateContextValue}>
        <ChannelActionProvider value={channelActionContextValue}>
          <ComponentProvider value={componentContextValue}>
            <EmojiProvider value={emojiContextValue}>
              <TypingProvider value={typingContextValue}>
                <div className='str-chat__container'>{children}</div>
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
