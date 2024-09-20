import React, { useEffect } from 'react';
import clsx from 'clsx';

import { MESSAGE_ACTIONS } from '../Message';
import { MessageInput, MessageInputFlat, MessageInputProps } from '../MessageInput';
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
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';
import { useThreadsViewContext } from '../ChatView';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';
import type { MessageActionsArray } from '../Message/utils';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../types/types';
import type { ThreadState } from 'stream-chat';

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
  const threadInstance = useThreadContext();

  if ((!thread && !threadInstance) || channelConfig?.replies === false) return null;

  // the wrapper ensures a key variable is set and the component recreates on thread switch
  return (
    // FIXME: TS is having trouble here as at least one of the two would always be defined
    <ThreadInner {...props} key={`thread-${(thread ?? threadInstance)?.id}-${channel?.cid}`} />
  );
};

const selector = (nextValue: ThreadState) =>
  [
    nextValue.replies,
    nextValue.pagination.isLoadingPrev,
    nextValue.pagination.isLoadingNext,
    nextValue.parentMessage,
  ] as const;

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
    Input: PropInput,
    Message: PropMessage,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    virtualized,
  } = props;

  const threadInstance = useThreadContext();
  const [latestReplies, isLoadingPrev, isLoadingNext, parentMessage] =
    useStateStore(threadInstance?.state, selector) ?? [];

  const {
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages = [],
    threadSuppressAutoscroll,
  } = useChannelStateContext<StreamChatGenerics>('Thread');
  const { closeThread, loadMoreThread } = useChannelActionContext<StreamChatGenerics>('Thread');
  const { setActiveThread } = useThreadsViewContext();
  const { customClasses } = useChatContext<StreamChatGenerics>('Thread');
  const {
    ThreadInput: ContextInput,
    Message: ContextMessage,
    ThreadHead = DefaultThreadHead,
    ThreadHeader = DefaultThreadHeader,
    VirtualMessage,
  } = useComponentContext<StreamChatGenerics>('Thread');

  const ThreadInput =
    PropInput ?? additionalMessageInputProps?.Input ?? ContextInput ?? MessageInputFlat;

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
  const MessageUIComponent = ThreadMessage || FallbackMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;

  useEffect(() => {
    if (thread?.id && thread?.reply_count) {
      // FIXME: integrators can customize channel query options but cannot customize channel.getReplies() options
      loadMoreThread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, loadMoreThread]);

  const threadProps: Pick<
    VirtualizedMessageListProps<StreamChatGenerics>,
    | 'hasMoreNewer'
    | 'loadMoreNewer'
    | 'loadingMoreNewer'
    | 'hasMore'
    | 'loadMore'
    | 'loadingMore'
    | 'messages'
  > = threadInstance
    ? {
        loadingMore: isLoadingPrev,
        loadingMoreNewer: isLoadingNext,
        loadMore: threadInstance.loadPrevPage,
        loadMoreNewer: threadInstance.loadNextPage,
        messages: latestReplies,
      }
    : {
        hasMore: threadHasMore,
        loadingMore: threadLoadingMore,
        loadMore: loadMoreThread,
        messages: threadMessages,
      };

  const messageAsThread = thread ?? parentMessage;

  if (!messageAsThread) return null;

  const threadClass =
    customClasses?.thread ||
    clsx('str-chat__thread-container str-chat__thread', {
      'str-chat__thread--virtualized': virtualized,
    });

  const head = (
    <ThreadHead
      key={messageAsThread.id}
      message={messageAsThread}
      Message={MessageUIComponent}
      {...additionalParentMessageProps}
    />
  );

  return (
    <div className={threadClass}>
      <ThreadHeader
        closeThread={threadInstance ? () => setActiveThread(undefined) : closeThread}
        thread={messageAsThread}
      />
      <ThreadMessageList
        disableDateSeparator={!enableDateSeparator}
        head={head}
        Message={MessageUIComponent}
        messageActions={messageActions}
        suppressAutoscroll={threadSuppressAutoscroll}
        threadList
        {...threadProps}
        {...(virtualized ? additionalVirtualizedMessageListProps : additionalMessageListProps)}
      />
      <MessageInput
        focus={autoFocus}
        Input={ThreadInput}
        parent={thread ?? parentMessage}
        publishTypingEvent={false}
        {...additionalMessageInputProps}
      />
    </div>
  );
};
