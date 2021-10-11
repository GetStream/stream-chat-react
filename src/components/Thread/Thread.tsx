import React, { useEffect, useRef } from 'react';

import { FixedHeightMessage } from '../Message/FixedHeightMessage';
import { Message } from '../Message/Message';
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

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ThreadProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
> = {
  /** Additional props for `MessageInput` component: [available props](https://getstream.io/chat/docs/sdk/react/message-input-components/message_input/#props) */
  additionalMessageInputProps?: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>;
  /** Additional props for `MessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/message_list/#props) */
  additionalMessageListProps?: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.io/chat/docs/sdk/react/message-components/message/#props) */
  additionalParentMessageProps?: MessageProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** Additional props for `VirtualizedMessageList` component: [available props](https://getstream.io/chat/docs/sdk/react/core-components/virtualized_list/#props) */
  additionalVirtualizedMessageListProps?: VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** If true, focuses the `MessageInput` component on opening a thread */
  autoFocus?: boolean;
  /** Display the thread on 100% width of its parent container. Useful for mobile style view */
  fullWidth?: boolean;
  /** Custom thread input UI component used to override the default `Input` value stored in `ComponentContext` or the [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInputSmall.tsx) default */
  Input?: React.ComponentType;
  /** Custom thread message UI component used to override the default `Message` value stored in `ComponentContext` */
  Message?: React.ComponentType<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** If true, render the `VirtualizedMessageList` instead of the standard `MessageList` component */
  virtualized?: boolean;
};

/**
 * The Thread component renders a parent Message with a list of replies
 */
export const Thread = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: ThreadProps<At, Ch, Co, Ev, Me, Re, Us, V>,
) => {
  const { channel, channelConfig, thread } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'Thread',
  );

  if (!thread || channelConfig?.replies === false) return null;

  // The wrapper ensures a key variable is set and the component recreates on thread switch
  return <ThreadInner {...props} key={`thread-${thread.id}-${channel?.cid}`} />;
};

export type ThreadHeaderProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  closeThread: (event: React.BaseSyntheticEvent) => void;
  thread: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

const DefaultThreadHeader = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { closeThread, thread } = props;

  const { t } = useTranslationContext('Thread');

  const getReplyCount = () => {
    if (!thread.reply_count) return '';
    if (thread.reply_count === 1) return t('1 reply');
    return t('{{ replyCount }} replies', {
      replyCount: thread.reply_count,
    });
  };

  return (
    <div className='str-chat__thread-header'>
      <div className='str-chat__thread-header-details'>
        <strong>{t('Thread')}</strong>
        <small>{getReplyCount()}</small>
      </div>
      <button
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

const DefaultThreadStart: React.FC = () => {
  const { t } = useTranslationContext('Thread');

  return <div className='str-chat__thread-start'>{t('Start of a new thread')}</div>;
};

const ThreadInner = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: ThreadProps<At, Ch, Co, Ev, Me, Re, Us, V> & { key: string },
) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    additionalVirtualizedMessageListProps,
    autoFocus = true,
    fullWidth = false,
    Input: PropInput,
    Message: PropMessage,
    virtualized,
  } = props;

  const { thread, threadHasMore, threadLoadingMore, threadMessages } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('Thread');
  const { closeThread, loadMoreThread } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>(
    'Thread',
  );
  const { customClasses } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('Thread');
  const {
    ThreadInput: ContextInput,
    Message: ContextMessage,
    ThreadHeader = DefaultThreadHeader,
    ThreadStart = DefaultThreadStart,
    VirtualMessage = FixedHeightMessage,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('Thread');

  const messageList = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (messageList.current && threadMessages?.length) {
      const { clientHeight, scrollHeight, scrollTop } = messageList.current;
      const scrollDown = clientHeight + scrollTop !== scrollHeight;

      if (scrollDown) {
        messageList.current.scrollTop = scrollHeight - clientHeight;
      }
    }
  }, [threadMessages?.length]);

  if (!thread) return null;

  const threadClass = customClasses?.thread || 'str-chat__thread';

  return (
    <div className={`${threadClass} ${fullWidth ? 'str-chat__thread--full' : ''}`}>
      <ThreadHeader closeThread={closeThread} thread={thread} />
      <div className='str-chat__thread-list' ref={messageList}>
        <Message
          initialMessage
          message={thread}
          Message={ThreadMessage || FallbackMessage}
          threadList
          {...additionalParentMessageProps}
        />
        <ThreadStart />
        <ThreadMessageList
          hasMore={threadHasMore}
          loadingMore={threadLoadingMore}
          loadMore={loadMoreThread}
          Message={ThreadMessage || FallbackMessage}
          messages={threadMessages || []}
          threadList
          {...(virtualized ? additionalVirtualizedMessageListProps : additionalMessageListProps)}
        />
      </div>
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
