import React, { useEffect } from 'react';
import clsx from 'clsx';

import { MESSAGE_ACTIONS } from '../Message';
import {
  MessageInput,
  MessageInputFlat,
  MessageInputProps,
  MessageInputSmall,
} from '../MessageInput';
import {
  MessageList,
  MessageListProps,
  VirtualizedMessageList,
  VirtualizedMessageListProps,
} from '../MessageList';
import { ThreadHeader as DefaultThreadHeader } from './ThreadHeader';
import { ThreadHead as DefaultThreadHead } from '../Thread/ThreadHead';

import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useComponentContext,
} from '../../context';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';
import type { MessageActionsArray } from '../Message/utils';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';

export type ThreadProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
> = {
  /** Additional props for `MessageInput` component: [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps<StreamChatGenerics, V>;
  /** Additional props for `MessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/message_list/#props) */
  additionalMessageListProps?: MessageListProps<StreamChatGenerics>;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.io/chat/docs/sdk/react/message-components/message/#props) */
  additionalParentMessageProps?: Partial<MessageProps<StreamChatGenerics>>;
  /** Additional props for `VirtualizedMessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/virtualized_list/#props) */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps<StreamChatGenerics>;
  /** If true, focuses the `MessageInput` component on opening a thread */
  autoFocus?: boolean;
  /** Injects date separator components into `Thread`, defaults to `false`. To be passed to the underlying `MessageList` or `VirtualizedMessageList` components */
  enableDateSeparator?: boolean;
  /** Display the thread on 100% width of its parent container. Useful for mobile style view */
  fullWidth?: boolean;
  /** Custom thread input UI component used to override the default `Input` value stored in `ComponentContext` or the [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputSmall.tsx) default */
  Input?: React.ComponentType;
  /** Custom thread message UI component used to override the default `Message` value stored in `ComponentContext` */
  Message?: React.ComponentType<MessageUIComponentProps<StreamChatGenerics>>;
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** If true, render the `VirtualizedMessageList` instead of the standard `MessageList` component */
  virtualized?: boolean;
};

/**
 * The Thread component renders a parent Message with a list of replies
 */
export const Thread = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: ThreadProps<StreamChatGenerics, V>,
) => {
  const { channel, channelConfig, thread } = useChannelStateContext<StreamChatGenerics>('Thread');

  if (!thread || channelConfig?.replies === false) return null;

  // The wrapper ensures a key variable is set and the component recreates on thread switch
  return <ThreadInner {...props} key={`thread-${thread.id}-${channel?.cid}`} />;
};

const ThreadInner = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: ThreadProps<StreamChatGenerics, V> & { key: string },
) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    additionalVirtualizedMessageListProps,
    autoFocus = true,
    enableDateSeparator = false,
    fullWidth = false,
    Input: PropInput,
    Message: PropMessage,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    virtualized,
  } = props;

  const {
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
    threadSuppressAutoscroll,
  } = useChannelStateContext<StreamChatGenerics>('Thread');
  const { closeThread, loadMoreThread } = useChannelActionContext<StreamChatGenerics>('Thread');
  const { customClasses, themeVersion } = useChatContext<StreamChatGenerics>('Thread');
  const {
    ThreadInput: ContextInput,
    Message: ContextMessage,
    ThreadHead = DefaultThreadHead,
    ThreadHeader = DefaultThreadHeader,
    VirtualMessage,
  } = useComponentContext<StreamChatGenerics>('Thread');

  const ThreadInput =
    PropInput ??
    additionalMessageInputProps?.Input ??
    ContextInput ??
    (themeVersion === '2' ? MessageInputFlat : MessageInputSmall);

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
  const MessageUIComponent = ThreadMessage || FallbackMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;

  useEffect(() => {
    if (thread?.id && thread?.reply_count) {
      loadMoreThread();
    }
  }, []);

  if (!thread) return null;

  const threadClass =
    customClasses?.thread ||
    clsx('str-chat__thread-container str-chat__thread', {
      'str-chat__thread--full': fullWidth,
      'str-chat__thread--virtualized': virtualized,
    });

  const head = (
    <ThreadHead
      key={thread.id}
      message={thread}
      Message={MessageUIComponent}
      {...additionalParentMessageProps}
    />
  );

  return (
    <div className={threadClass}>
      <ThreadHeader closeThread={closeThread} thread={thread} />
      <ThreadMessageList
        disableDateSeparator={!enableDateSeparator}
        hasMore={threadHasMore}
        head={head}
        loadingMore={threadLoadingMore}
        loadMore={loadMoreThread}
        Message={MessageUIComponent}
        messageActions={messageActions}
        messages={threadMessages || []}
        suppressAutoscroll={threadSuppressAutoscroll}
        threadList
        {...(virtualized ? additionalVirtualizedMessageListProps : additionalMessageListProps)}
      />
      <MessageInput
        focus={autoFocus}
        Input={ThreadInput}
        parent={thread}
        publishTypingEvent={false}
        {...additionalMessageInputProps}
      />
    </div>
  );
};
