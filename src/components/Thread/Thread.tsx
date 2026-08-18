import React, { useCallback, useEffect } from 'react';
import clsx from 'clsx';

import { LegacyThreadContext } from './LegacyThreadContext';
import { WithAudioPlayback } from '../AudioPlayback';
import { MESSAGE_ACTIONS } from '../Message';
import type { MessageComposerProps } from '../MessageComposer';
import { MessageComposer } from '../MessageComposer';
import type { MessageListProps, VirtualizedMessageListProps } from '../MessageList';
import { MessageList, VirtualizedMessageList } from '../MessageList';
import { ThreadHeader as DefaultThreadHeader } from './ThreadHeader';
import { ThreadHead as DefaultThreadHead } from '../Thread/ThreadHead';

import {
  useChatContext,
  useComponentContext,
  useWorkspaceNavigation,
} from '../../context';
import { useThreadContext } from '../Threads';
import { useStateStore } from '../../store';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';
import type { MessageActionsArray } from '../Message/utils';
import type { LocalMessage, Thread as StreamThread, ThreadState } from 'stream-chat';

export type ThreadProps = {
  /** Additional props for `MessageComposer` component: [available props](https://getstream.io/chat/docs/sdk/react/message-composer-components/message_composer/#props) */
  additionalMessageComposerProps?: MessageComposerProps;
  /** Additional props for `MessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/message_list/#props) */
  additionalMessageListProps?: MessageListProps;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.io/chat/docs/sdk/react/message-components/message/#props) */
  additionalParentMessageProps?: Partial<MessageProps>;
  /** Additional props for `VirtualizedMessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/virtualized_list/#props) */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps;
  /** Allows multiple audio players to play the audio at the same time within this thread. Disabled by default. */
  allowConcurrentAudioPlayback?: boolean;
  /** If true, focuses the `MessageComposer` component on opening a thread */
  autoFocus?: boolean;
  /** Injects date separator components into `Thread`, defaults to `false`. To be passed to the underlying `MessageList` or `VirtualizedMessageList` components */
  enableDateSeparator?: boolean;
  /** Custom thread message UI component used to override the default `Message` value stored in `ComponentContext` */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** Array of allowed message actions (ex: ['edit', 'delete', 'flag', 'mute', 'pin', 'quote', 'react', 'reply']). To disable all actions, provide an empty array. */
  messageActions?: MessageActionsArray;
  /** If true, render the `VirtualizedMessageList` instead of the standard `MessageList` component */
  virtualized?: boolean;
};

/**
 * The Thread component renders a parent Message with a list of replies
 */
export const Thread = (props: ThreadProps) => {
  const threadInstance = useThreadContext();

  if (!threadInstance) return null;
  if (threadInstance.channel.config.replies.enabled === false) return null;

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
    additionalMessageComposerProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    additionalVirtualizedMessageListProps,
    allowConcurrentAudioPlayback,
    autoFocus = true,
    enableDateSeparator = false,
    Message: PropMessage,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    virtualized,
  } = props;
  const threadInstance = useThreadContext();
  const { client, customClasses } = useChatContext('Thread');
  const {
    Message: ContextMessage,
    ThreadHead = DefaultThreadHead,
    ThreadHeader = DefaultThreadHeader,
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

  const { closeThread: closeThreadPanel } = useWorkspaceNavigation();

  const closeThread = useCallback(() => {
    closeThreadPanel(threadInstance?.id);
    // Keep legacy behavior when Thread is used outside a workspace navigation flow.
    threadInstance?.deactivate();
  }, [closeThreadPanel, threadInstance]);

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized && VirtualMessage ? VirtualMessage : ContextMessage;
  const MessageUIComponent = ThreadMessage || FallbackMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;

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
      {/* The thread owns its audio-player pool (rather than inheriting one from an ambient
          <Channel>) because a slot-bound Thread is a sibling of the channel, not nested inside
          it. Scoping the pool here means thread audio stops when the thread unmounts. */}
      <WithAudioPlayback allowConcurrentPlayback={allowConcurrentAudioPlayback}>
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
          <MessageComposer
            focus={autoFocus}
            parent={parentMessage}
            {...additionalMessageComposerProps}
          />
        </div>
      </WithAudioPlayback>
    </LegacyThreadContext.Provider>
  );
};
