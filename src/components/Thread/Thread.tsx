import React, { useEffect } from 'react';

import { FixedHeightMessage } from '../Message/FixedHeightMessage';
import { MessageInput, MessageInputProps } from '../MessageInput/MessageInput';
import { MessageInputSmall } from '../MessageInput/MessageInputSmall';
import { MessageList, MessageListProps } from '../MessageList/MessageList';
import {
  VirtualizedMessageList,
  VirtualizedMessageListProps,
} from '../MessageList/VirtualizedMessageList';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';

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
  additionalParentMessageProps?: MessageProps<StreamChatGenerics>;
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

export type ThreadHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  closeThread: (event: React.BaseSyntheticEvent) => void;
  thread: StreamMessage<StreamChatGenerics>;
};

const DefaultThreadHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ThreadHeaderProps<StreamChatGenerics>,
) => {
  const { closeThread, thread } = props;

  const { t } = useTranslationContext('Thread');

  const getReplyCount = () => {
    if (!thread.reply_count) return '';
    return t('replyCount', { count: thread.reply_count });
  };

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <strong>{t<string>('Thread')}</strong>
        <small>{getReplyCount()}</small>
      </div>
      <button
        aria-label='Close thread'
        className='str-chat__square-button'
        data-testid='close-button'
        onClick={(event) => closeThread(event)}
      >
        <svg height='10' width='10' xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z'
            fillRule='evenodd'
          />
        </svg>
      </button>
    </div>
  );
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
  const { customClasses } = useChatContext<StreamChatGenerics>('Thread');
  const {
    ThreadInput: ContextInput,
    Message: ContextMessage,
    ThreadHeader = DefaultThreadHeader,
    VirtualMessage = FixedHeightMessage,
  } = useComponentContext<StreamChatGenerics>('Thread');

  const ThreadInput =
    PropInput || additionalMessageInputProps?.Input || ContextInput || MessageInputSmall;

  const ThreadMessage = PropMessage || additionalMessageListProps?.Message;
  const FallbackMessage = virtualized ? VirtualMessage : ContextMessage;

  const ThreadMessageList = virtualized ? VirtualizedMessageList : MessageList;

  useEffect(() => {
    if (thread?.id && thread?.reply_count) {
      loadMoreThread();
    }
  }, []);

  if (!thread) return null;

  const threadClass = customClasses?.thread || 'str-chat__thread';

  return (
    <div className={`${threadClass} ${fullWidth ? 'str-chat__thread--full' : ''}`}>
      <ThreadHeader closeThread={closeThread} thread={thread} />
      <ThreadMessageList
        additionalParentMessageProps={additionalParentMessageProps}
        disableDateSeparator={!enableDateSeparator}
        hasMore={threadHasMore}
        loadingMore={threadLoadingMore}
        loadMore={loadMoreThread}
        Message={ThreadMessage || FallbackMessage}
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
