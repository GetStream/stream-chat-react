import React, { useEffect, useRef } from 'react';

import { Message } from '../Message';
import { MessageInput, MessageInputSmall } from '../MessageInput';
import { MessageList, MessageListProps } from '../MessageList';

import { useChannelContext } from '../../context/ChannelContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { TFunction } from 'i18next';
import type { ChannelState, MessageResponse } from 'stream-chat';

import type { MessageProps, MessageUIComponentProps } from '../Message/types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type ThreadProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps?: UnknownType; // TODO: add MessageInputProps<add generics> when MessageInput is typed
  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react/#messagelist
   * */
  additionalMessageListProps?: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Additional props for underlying Message component of parent message at the top.
   * Available props - https://getstream.github.io/stream-chat-react/#message
   * */
  additionalParentMessageProps?: MessageProps<At, Ch, Co, Ev, Me, Re, Us>;
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth?: boolean;
  /** UI component to override the default Message stored in channel context */
  Message?: React.ComponentType<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Customized MessageInput component to used within Thread instead of default MessageInput
     Useable as follows:
     ```
     <Thread MessageInput={(props) => <MessageInput parent={props.parent} Input={MessageInputSmall} /> }/>
     ```
 */
  MessageInput?: React.ComponentType<unknown>; // TODO: add generic when MessageInput is typed
  /** UI component used to override the default header of the thread */
  ThreadHeader?: React.ComponentType<
    ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
};

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 * @example ./Thread.md
 */
export const Thread = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, thread } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  if (!thread || channel?.getConfig?.()?.replies === false) return null;

  // The wrapper ensures a key variable is set and the component recreates on thread switch
  return <ThreadInner {...props} key={`thread-${thread.id}-${channel?.cid}`} />;
};

export type ThreadHeaderProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  t: TFunction;
  closeThread?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  thread?:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']> // TODO - maybe remove ReturnType message
    | MessageResponse<At, Ch, Co, Me, Re, Us>
    | null;
};

const DefaultThreadHeader = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadHeaderProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { closeThread, t, thread } = props;

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
        <strong>{t && t('Thread')}</strong>
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

const ThreadInner = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ThreadProps<At, Ch, Co, Ev, Me, Re, Us> & { key: string },
) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    autoFocus = true,
    fullWidth = false,
    Message: PropMessage,
    MessageInput: ThreadMessageInput = MessageInput,
    ThreadHeader = DefaultThreadHeader,
  } = props;

  const {
    channel,
    closeThread,
    loadMoreThread,
    Message: ContextMessage,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const messageList = useRef<HTMLDivElement | null>(null);

  const parentID = thread?.id;
  const ThreadMessage = PropMessage || ContextMessage;

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

  const read = {};

  return (
    <div
      className={`str-chat__thread ${
        fullWidth ? 'str-chat__thread--full' : ''
      }`}
    >
      <ThreadHeader closeThread={closeThread} t={t} thread={thread} />
      <div className='str-chat__thread-list' ref={messageList}>
        <Message
          channel={channel}
          client={client}
          initialMessage
          message={thread}
          Message={ThreadMessage}
          threadList
          {...additionalParentMessageProps}
        />
        <div className='str-chat__thread-start'>
          {t('Start of a new thread')}
        </div>
        {/** @ts-expect-error */}
        <MessageList
          hasMore={threadHasMore}
          loadingMore={threadLoadingMore}
          loadMore={loadMoreThread}
          Message={ThreadMessage}
          messages={threadMessages || []}
          read={read}
          threadList
          {...additionalMessageListProps}
        />
      </div>
      <ThreadMessageInput
        focus={autoFocus}
        Input={MessageInputSmall}
        // @ts-expect-error
        parent={thread}
        publishTypingEvent={false}
        {...additionalMessageInputProps}
      />
    </div>
  );
};
