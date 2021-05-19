import React, { useEffect, useRef } from 'react';

import { Message } from '../Message/Message';
import { MessageInput, MessageInputProps } from '../MessageInput/MessageInput';
import { MessageInputSmall } from '../MessageInput/MessageInputSmall';
import { MessageList, MessageListProps } from '../MessageList/MessageList';

import { useChannelActionContext } from '../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
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
  /** Additional props for `MessageInput` component: [available props](https://getstream.github.io/stream-chat-react/#messageinput) */
  additionalMessageInputProps?: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>;
  /** Additional props for `MessageList` component: [available props](https://getstream.github.io/stream-chat-react/#messagelist) */
  additionalMessageListProps?: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** Additional props for `Message` component of the parent message: [available props](https://getstream.github.io/stream-chat-react/#message) */
  additionalParentMessageProps?: MessageProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth?: boolean;
  /** Custom UI component to override the default Message stored in ComponentContext */
  Message?: React.ComponentType<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Custom UI component to replace the `MessageInput`, defaults to and accepts same props as: [MessageInput](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/MessageInput.tsx) */
  MessageInput?: React.ComponentType<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>>;
  ThreadHeader?: React.ComponentType<ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>>;
};

/**
 * The Thread component renders a parent Message with a list of replies.
 * The underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 * @example ./Thread.md
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
  const { channel, thread } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  if (!thread || channel?.getConfig?.()?.replies === false) return null;

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
  closeThread?: (event: React.BaseSyntheticEvent) => void;
  thread?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
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

  const { t } = useTranslationContext();

  const getReplyCount = () => {
    if (!thread?.reply_count || !t) return '';
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
        onClick={(event) => closeThread && closeThread(event)}
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
  const { t } = useTranslationContext();

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
    autoFocus = true,
    fullWidth = false,
    Message: PropMessage,
    MessageInput: ThreadInput = MessageInputSmall,
    ThreadHeader: PropThreadHeader,
  } = props;

  const { thread, threadHasMore, threadLoadingMore, threadMessages } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { closeThread, loadMoreThread } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    Message: ContextMessage,
    ThreadHeader: ContextThreadHeader = DefaultThreadHeader,
    ThreadStart = DefaultThreadStart,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const messageList = useRef<HTMLDivElement | null>(null);

  const parentID = thread?.id;
  const ThreadHeader = PropThreadHeader || ContextThreadHeader;
  const ThreadMessage = PropMessage || additionalMessageListProps?.Message || ContextMessage;

  useEffect(() => {
    if (parentID && thread?.reply_count && loadMoreThread) {
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

  return (
    <div className={`str-chat__thread ${fullWidth ? 'str-chat__thread--full' : ''}`}>
      <ThreadHeader closeThread={closeThread} thread={thread} />
      <div className='str-chat__thread-list' ref={messageList}>
        <Message
          initialMessage
          message={thread}
          Message={ThreadMessage}
          threadList
          {...additionalParentMessageProps}
        />
        <ThreadStart />
        <MessageList
          hasMore={threadHasMore}
          loadingMore={threadLoadingMore}
          loadMore={loadMoreThread}
          Message={ThreadMessage}
          messages={threadMessages || []}
          threadList
          {...additionalMessageListProps}
        />
      </div>
      <MessageInput<At, Ch, Co, Ev, Me, Re, Us, V>
        focus={autoFocus}
        Input={ThreadInput}
        parent={thread}
        publishTypingEvent={false}
        {...additionalMessageInputProps}
      />
    </div>
  );
};
