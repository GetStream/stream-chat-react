/* eslint-disable import/no-extraneous-dependencies */
import React, { PropsWithChildren, useCallback, useState } from 'react';
import {
  Attachment,
  ChannelActionContextValue,
  ChannelActionProvider,
  ChannelNotifications,
  ChannelStateContextValue,
  ChannelStateProvider,
  ComponentContextValue,
  ComponentProvider,
  defaultReactionOptions,
  DefaultStreamChatGenerics,
  makeAddNotifications,
  MessageSimple,
  MessageToSend,
  StreamMessage,
  TypingContextValue,
  TypingProvider,
  useChannelContainerClasses,
  useChatContext,
} from 'stream-chat-react';
import { Message, MessageResponse, SendMessageOptions, Thread, UserResponse } from 'stream-chat';

import clsx from 'clsx';
import { nanoid } from 'nanoid';
import { useThreadListContext } from './ThreadListContext';

export type Props<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  thread: Thread<StreamChatGenerics>;
};
const NotSupported = () => {
  throw new Error('Not Supported');
};

const UnMemoizedThreadChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: PropsWithChildren<Props<StreamChatGenerics>>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { children, thread } = props;
  const channel = client.channel('messaging', thread.channel.id);
  const { setThreads } = useThreadListContext();
  const {
    channelClass,
    chatClass,
    chatContainerClass,
    windowsEmojiClass,
  } = useChannelContainerClasses({});
  const className = clsx(chatClass, null, channelClass);
  const [notifications, setNotifications] = useState<ChannelNotifications>([]);

  const notificationTimeouts: Array<NodeJS.Timeout> = [];
  // Adds a temporary notification to message list, will be removed after 5 seconds
  const addNotification = makeAddNotifications(setNotifications, notificationTimeouts);

  const deleteMessage = useCallback(
    async (
      message: StreamMessage<StreamChatGenerics>,
    ): Promise<MessageResponse<StreamChatGenerics>> => {
      if (!message?.id) {
        throw new Error('Cannot delete a message - missing message ID.');
      }
      const result = await client.deleteMessage(message.id);
      return result.message;
    },
    [client],
  );

  const updateMessage = (
    updatedMessage: MessageToSend<StreamChatGenerics> | StreamMessage<StreamChatGenerics>,
  ) => {
    if (!updatedMessage.id) {
      throw new Error('Cannot update a message - missing message ID.');
    }
    thread.addReply(updatedMessage as MessageResponse<StreamChatGenerics>);
    setThreads((threads) => [...threads]);
  };

  const isUserResponseArray = (
    output: string[] | UserResponse<StreamChatGenerics>[],
  ): output is UserResponse<StreamChatGenerics>[] =>
    (output as UserResponse<StreamChatGenerics>[])[0]?.id != null;

  const doSendMessage = async (
    message: MessageToSend<StreamChatGenerics> | StreamMessage<StreamChatGenerics>,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
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
      text,
      ...customMessageData,
    } as Message<StreamChatGenerics>;

    try {
      const messageResponse = await channel.sendMessage(messageData, options);

      let existingMessage;
      for (let i = thread.latestReplies.length - 1; i >= 0; i--) {
        const msg = thread.latestReplies[i];
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

  const channelCapabilitiesArray = channel.data?.own_capabilities as string[];
  const channelCapabilities = {} as Record<string, boolean>;
  channelCapabilitiesArray?.forEach((capability) => {
    channelCapabilities[capability] = true;
  });

  const channelStateContextValue = {
    channel,
    channelCapabilities,
    notifications,
    suppressAutoscroll: false,
  } as ChannelStateContextValue<StreamChatGenerics>;

  const channelActionContextValue = {
    addNotification,
    closeThread: NotSupported,
    deleteMessage,
    dispatch: NotSupported,
    editMessage: NotSupported,
    jumpToLatestMessage: NotSupported,
    jumpToMessage: NotSupported,
    loadMore: NotSupported,
    loadMoreNewer: NotSupported,
    loadMoreThread: NotSupported,
    onMentionsClick: NotSupported,
    onMentionsHover: NotSupported,
    openThread: NotSupported,
    removeMessage: NotSupported,
    retrySendMessage,
    sendMessage,
    setQuotedMessage: NotSupported,
    updateMessage,
  } as ChannelActionContextValue<StreamChatGenerics>;

  const componentContextValue = {
    Attachment,
    Message: MessageSimple,
    MessageRepliesCountButton: () => null,
    reactionOptions: defaultReactionOptions,
  } as ComponentContextValue<StreamChatGenerics>;
  const typingContextValue = {} as TypingContextValue<StreamChatGenerics>;

  return (
    <div className={clsx(className, windowsEmojiClass)}>
      <ChannelStateProvider value={channelStateContextValue}>
        <ChannelActionProvider value={channelActionContextValue}>
          <ComponentProvider value={componentContextValue}>
            <TypingProvider value={typingContextValue}>
              <div className={`${chatContainerClass}`}>
                <>{children}</>
              </div>
            </TypingProvider>
          </ComponentProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </div>
  );
};

export const ThreadChannelProvider = React.memo(
  UnMemoizedThreadChannel,
) as typeof UnMemoizedThreadChannel;
