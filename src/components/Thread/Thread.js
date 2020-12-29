// @ts-check
import React, { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { Message } from '../Message';
import { MessageInput, MessageInputSmall } from '../MessageInput';
import { MessageList } from '../MessageList';

import { ChannelContext, ChatContext, TranslationContext } from '../../context';
import { smartRender } from '../../utils';

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ../../docs/Thread.md
 * @typedef {import('types').ThreadProps} ThreadProps
 * @type { React.FC<ThreadProps>}
 */
const Thread = (props) => {
  const { channel, thread } = useContext(ChannelContext);

  if (!thread || channel?.getConfig?.()?.replies === false) return null;

  // The wrapper ensures a key variable is set and the component recreates on thread switch
  return <ThreadInner {...props} key={`thread-${thread.id}-${channel?.cid}`} />;
};

Thread.propTypes = {
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react/#messagelist
   * */
  additionalMessageListProps: PropTypes.object,
  /**
   * Additional props for underlying Message component of parent message at the top.
   * Available props - https://getstream.github.io/stream-chat-react/#message
   * */
  additionalParentMessageProps: PropTypes.object,
  /** Make input focus on mounting thread */
  autoFocus: PropTypes.bool,
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth: PropTypes.bool,
  /** UI component to override the default Message stored in channel context */
  Message: /** @type {PropTypes.Validator<React.ComponentType<import('types').MessageUIComponentProps>>} */ (PropTypes.elementType),
  /** Customized MessageInput component to used within Thread instead of default MessageInput
      Useable as follows:
      ```
      <Thread MessageInput={(props) => <MessageInput parent={props.parent} Input={MessageInputSmall} /> }/>
      ```
  */
  MessageInput: /** @type {PropTypes.Validator<React.ComponentType<import('types').MessageInputProps>>} */ (PropTypes.elementType),
  /** UI component used to override the default header of the thread */
  ThreadHeader: /** @type {PropTypes.Validator<React.ComponentType<import('types').ThreadHeaderProps>>} */ (PropTypes.elementType),
};

Thread.defaultProps = {
  fullWidth: false,
  autoFocus: true,
  MessageInput,
};

/**
 * @type { React.FC<import('types').ThreadHeaderProps> }
 */
const DefaultThreadHeader = ({ closeThread, t, thread }) => {
  const getReplyCount = () => {
    if (!thread?.reply_count || !t) return '';
    if (thread.reply_count === 1) return t('1 reply');
    return t('{{ replyCount }} replies', {
      replyCount: thread.reply_count,
    });
  };

  return (
    <div className="str-chat__thread-header">
      <div className="str-chat__thread-header-details">
        <strong>{t && t('Thread')}</strong>
        <small>{getReplyCount()}</small>
      </div>
      <button
        onClick={(e) => closeThread && closeThread(e)}
        className="str-chat__square-button"
        data-testid="close-button"
      >
        <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z"
            fillRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

/**
 * @typedef {import('types').ThreadProps & {key: string}} ThreadInnerProps
 * @type { React.FC<ThreadInnerProps>}
 */
const ThreadInner = (props) => {
  const {
    additionalMessageInputProps,
    additionalMessageListProps,
    additionalParentMessageProps,
    autoFocus,
    fullWidth,
    Message: PropMessage,
    MessageInput: ThreadMessageInput,
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
  } = useContext(ChannelContext);
  const { client } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);

  const messageList = useRef(/** @type {HTMLDivElement | null} */ (null));

  const parentID = thread?.id;
  const ThreadMessage = PropMessage || ContextMessage;

  useEffect(() => {
    if (parentID && thread?.reply_count && loadMoreThread) {
      loadMoreThread();
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (messageList.current && threadMessages?.length) {
      const { clientHeight, scrollTop, scrollHeight } = messageList.current;
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
      <div className="str-chat__thread-list" ref={messageList}>
        <Message
          channel={channel}
          client={client}
          initialMessage
          // @ts-expect-error
          message={thread}
          Message={ThreadMessage}
          threadList
          {...additionalParentMessageProps}
        />
        <div className="str-chat__thread-start">
          {t && t('Start of a new thread')}
        </div>
        <MessageList
          hasMore={threadHasMore}
          loadMore={loadMoreThread}
          loadingMore={threadLoadingMore}
          messages={threadMessages}
          Message={ThreadMessage}
          read={read}
          threadList
          {...additionalMessageListProps}
        />
      </div>
      {smartRender(ThreadMessageInput, {
        Input: MessageInputSmall,
        parent: thread,
        focus: autoFocus,
        publishTypingEvent: false,
        ...additionalMessageInputProps,
      })}
    </div>
  );
};

export default Thread;
