import React, { useCallback, useEffect } from 'react';
import clsx from 'clsx';

import { LegacyThreadContext } from './LegacyThreadContext';
import { MESSAGE_ACTIONS } from '../Message';
import type { MessageInputProps } from '../MessageInput';
import { MessageInput, MessageInputFlat } from '../MessageInput';
import type { MessageListProps, VirtualizedMessageListProps } from '../MessageList';
import { MessageList, VirtualizedMessageList } from '../MessageList';
import { useChatViewNavigation } from '../ChatView/ChatViewNavigationContext';
import { ThreadHeader as DefaultThreadHeader } from './ThreadHeader';
import { ThreadHead as DefaultThreadHead } from '../Thread/ThreadHead';
import { useThreadSlotContext } from './ThreadSlotContext';

import { useChatContext, useComponentContext } from '../../context';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';
import { useThreadRequestHandlers } from './hooks/useThreadRequestHandlers';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';
import type { MessageActionsArray } from '../Message/utils';
import type {
  DeleteMessageOptions,
  EventAPIResponse,
  LocalMessage,
  MarkReadOptions,
  Message,
  MessageResponse,
  SendMessageOptions,
  Channel as StreamChannel,
  StreamChat,
  Thread as StreamThread,
  ThreadState,
  UpdateMessageOptions,
} from 'stream-chat';

export type ThreadProps = {
  /** Additional props for `MessageInput` component: [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps;
  /** Additional props for `MessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/message_list/#props) */
  additionalMessageListProps?: MessageListProps;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.io/chat/docs/sdk/react/message-components/message/#props) */
  additionalParentMessageProps?: Partial<MessageProps>;
  /** Additional props for `VirtualizedMessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/virtualized_list/#props) */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps;
  /** If true, focuses the `MessageInput` component on opening a thread */
  autoFocus?: boolean;
  /** Injects date separator components into `Thread`, defaults to `false`. To be passed to the underlying `MessageList` or `VirtualizedMessageList` components */
  enableDateSeparator?: boolean;
  /** Custom thread input UI component used to override the default `Input` value stored in `ComponentContext` or the [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputSmall.tsx) default */
  Input?: React.ComponentType;
  /** Custom thread message UI component used to override the default `Message` value stored in `ComponentContext` */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** Custom action handler to override the default `client.deleteMessage(message.id)` function in thread flows */
  doDeleteMessageRequest?: (
    thread: StreamThread,
    message: LocalMessage,
    options?: DeleteMessageOptions,
  ) => Promise<MessageResponse>;
  /** Custom action handler to override the default `thread.markAsRead` request function (advanced usage only) */
  doMarkReadRequest?: (params: {
    thread: StreamThread;
    options?: MarkReadOptions;
  }) => Promise<EventAPIResponse | null> | void;
  /** Custom action handler to override the default `channel.sendMessage` request function in thread flows */
  doSendMessageRequest?: (
    thread: StreamThread,
    message: Message,
    options?: SendMessageOptions,
  ) => ReturnType<StreamChannel['sendMessage']> | void;
  /** Custom action handler to override the default `client.updateMessage` request function in thread flows */
  doUpdateMessageRequest?: (
    thread: StreamThread,
    updatedMessage: LocalMessage | MessageResponse,
    options?: UpdateMessageOptions,
  ) => ReturnType<StreamChat['updateMessage']>;
  /** If true, render the `VirtualizedMessageList` instead of the standard `MessageList` component */
  virtualized?: boolean;
};

/**
 * The Thread component renders a parent Message with a list of replies
 */
export const Thread = (props: ThreadProps) => {
  const threadInstance = useThreadContext();

  if (!threadInstance) return null;
  // todo: remove the use of channel.getConfig
  if (threadInstance.channel.getConfig()?.replies === false) return null;

  // todo: maybe this extra layer with ThreadInner could be removed?
  // the wrapper ensures a key variable is set and the component recreates on thread switch
  return (
    <ThreadInner
      {...props}
      key={`thread-${threadInstance.id}-${threadInstance.channel.cid}`}
    />
  );
};

const selector = (nextValue: ThreadState) => ({
  isStateStale: nextValue.isStateStale,
  parentMessage: nextValue.parentMessage,
});

const messagePaginatorSelector = ({
  isLoading,
  items,
  lastQueryError,
}: {
  isLoading: boolean;
  items: LocalMessage[] | undefined;
  lastQueryError?: Error;
}) => ({
  isLoading,
  items,
  lastQueryError,
});

const threadManagerSelector = ({ threads }: { threads: StreamThread[] }) => ({ threads });

const ThreadInner = (props: ThreadProps & { key: string }) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    additionalVirtualizedMessageListProps,
    autoFocus = true,
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    enableDateSeparator = false,
    Input: PropInput,
    Message: PropMessage,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    virtualized,
  } = props;

  const threadInstance = useThreadContext();
  const threadSlot = useThreadSlotContext();
  const { client, customClasses } = useChatContext('Thread');
  const {
    Message: ContextMessage,
    ThreadHead = DefaultThreadHead,
    ThreadHeader = DefaultThreadHeader,
    ThreadInput: ContextInput,
    VirtualMessage,
  } = useComponentContext('Thread');

  const { isStateStale, parentMessage } =
    useStateStore(threadInstance?.state, selector) ?? {};
  const threadPaginatorState = useStateStore(
    threadInstance?.messagePaginator?.state,
    messagePaginatorSelector,
  );
  const threadManagerState = useStateStore(
    client.threads.state,
    threadManagerSelector,
  ) ?? {
    threads: client.threads.state.getLatestValue().threads,
  };
  const isThreadManaged = threadInstance?.id
    ? threadManagerState.threads.some(
        (managedThread) => managedThread.id === threadInstance.id,
      )
    : false;

  const { closeThread: closeThreadFromNavigation } = useChatViewNavigation();

  const closeThread = useCallback(() => {
    closeThreadFromNavigation(threadSlot ? { slot: threadSlot } : undefined);
    // Keep legacy behavior when Thread is used outside ChatView navigation flow.
    threadInstance?.deactivate();
  }, [closeThreadFromNavigation, threadInstance, threadSlot]);

  const ThreadInput =
    PropInput ?? additionalMessageInputProps?.Input ?? ContextInput ?? MessageInputFlat;

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
  const MessageUIComponent = ThreadMessage || FallbackMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;
  useThreadRequestHandlers({
    doDeleteMessageRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    threadInstance,
  });

  useEffect(() => {
    if (!threadInstance) return;
    if (isThreadManaged) return;
    if (threadPaginatorState?.items !== undefined || threadPaginatorState?.isLoading)
      return;
    void threadInstance.reload();
  }, [
    isThreadManaged,
    threadInstance,
    threadPaginatorState?.isLoading,
    threadPaginatorState?.items,
  ]);

  useEffect(() => {
    if (threadInstance && isStateStale) {
      void threadInstance.reload();
    }
  }, [isStateStale, threadInstance]);

  useEffect(() => {
    if (!threadInstance || isThreadManaged) return;
    if (threadPaginatorState?.isLoading) return;
    if (threadPaginatorState?.lastQueryError) return;
    if (threadPaginatorState?.items === undefined) return;

    client.threads.state.next((current) => {
      if (current.threads.some((thread) => thread.id === threadInstance.id)) {
        return current;
      }
      return {
        ...current,
        threads: [threadInstance, ...current.threads],
      };
    });
  }, [
    client.threads.state,
    isThreadManaged,
    threadInstance,
    threadPaginatorState?.isLoading,
    threadPaginatorState?.items,
    threadPaginatorState?.lastQueryError,
  ]);

  if (!threadInstance || !parentMessage) return null;

  const threadClass =
    customClasses?.thread ||
    clsx('str-chat__thread-container str-chat__thread', {
      'str-chat__thread--virtualized': virtualized,
    });

  const head = (
    <ThreadHead
      key={parentMessage.id}
      message={parentMessage}
      Message={MessageUIComponent}
      {...additionalParentMessageProps}
    />
  );

  return (
    // Thread component needs a context which we can use for message composer
    <LegacyThreadContext.Provider
      value={{
        legacyThread: parentMessage ?? undefined,
      }}
    >
      <div className={threadClass}>
        <ThreadHeader closeThread={closeThread} thread={parentMessage} />
        <ThreadMessageList
          disableDateSeparator={!enableDateSeparator}
          head={head}
          Message={MessageUIComponent}
          messageActions={messageActions}
          {...(virtualized
            ? additionalVirtualizedMessageListProps
            : additionalMessageListProps)}
        />
        <MessageInput
          focus={autoFocus}
          Input={ThreadInput}
          isThreadInput
          parent={parentMessage}
          {...additionalMessageInputProps}
        />
      </div>
    </LegacyThreadContext.Provider>
  );
};
