import React, { PropsWithChildren, useCallback, useContext } from 'react';
import {
  Attachment,
  ChannelActionContextValue,
  ChannelActionProvider,
  ChannelStateContextValue,
  ChannelStateProvider,
  ComponentContextValue,
  ComponentProvider,
  CustomTrigger,
  defaultReactionOptions,
  DefaultStreamChatGenerics,
  MessageSimple,
  MessageToSend,
  StreamMessage,
  TypingContextValue,
  TypingProvider,
  useChannelContainerClasses,
  useChatContext,
} from 'stream-chat-react';
import {
  Message,
  MessageResponse,
  SendMessageOptions,
  Channel as StreamChannel,
  UserResponse,
} from 'stream-chat';

import clsx from 'clsx';
import { nanoid } from 'nanoid';

export type ChannelProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  channel: StreamChannel<StreamChatGenerics>;
};
const unimplemented = () => {
  throw new Error('unimplemented');
};
const UnMemoizedChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: PropsWithChildren<ChannelProps<StreamChatGenerics, V>>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { channel, children } = props;
  const {
    channelClass,
    chatClass,
    chatContainerClass,
    windowsEmojiClass,
  } = useChannelContainerClasses({});
  const className = clsx(chatClass, null, channelClass);

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

    // TODO: Implement optimistic update
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
      // We don't support quoted message on threads.
      // quoted_message_id: parent_id === quotedMessage?.parent_id ? quotedMessage?.id : undefined,
      text,
      ...customMessageData,
    } as Message<StreamChatGenerics>;

    try {
      const messageResponse = await channel.sendMessage(messageData, options);

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

      // if (quotedMessage && parent_id === quotedMessage?.parent_id) setQuotedMessage(undefined);
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

  // const removeMessage = (message: StreamMessage<StreamChatGenerics>) => {
  //   channel.state.removeMessage(message);

  //   dispatch({
  //     channel,
  //     parentId: state.thread && message.parent_id,
  //     type: 'copyMessagesFromChannel',
  //   });
  // };
  const channelCapabilitiesArray = channel.data?.own_capabilities as string[];
  const channelCapabilities = {} as Record<string, boolean>;
  channelCapabilitiesArray?.forEach((capability) => {
    channelCapabilities[capability] = true;
  });
  // initialize all the context values
  // @ts-ignore
  const channelStateContextValue = {
    channel,
    channelCapabilities,
    suppressAutoscroll: false,
  } as ChannelStateContextValue<StreamChatGenerics>;

  const channelActionContextValue = {
    addNotification: unimplemented,
    closeThread: unimplemented,
    deleteMessage,
    dispatch: unimplemented,
    editMessage: unimplemented,
    jumpToLatestMessage: unimplemented,
    jumpToMessage: unimplemented,
    loadMore: () => Promise.resolve(0),
    loadMoreNewer: () => Promise.resolve(0),
    loadMoreThread: unimplemented,
    onMentionsClick: unimplemented,
    onMentionsHover: unimplemented,
    openThread: unimplemented,
    removeMessage: unimplemented,
    retrySendMessage: unimplemented,
    sendMessage,
    setQuotedMessage: unimplemented,
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

/**
 * A wrapper component that provides channel data and renders children.
 * The Channel component provides the following contexts:
 * - [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/)
 * - [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/)
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const ThreadChannelProvider = React.memo(UnMemoizedChannel) as typeof UnMemoizedChannel;
