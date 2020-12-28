// @ts-check
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { Message } from '../Message';
import { MessageInput, MessageInputSmall } from '../MessageInput';
import { MessageList } from '../MessageList';

import { withChannelContext, withTranslationContext } from '../../context';
import { checkChannelPropType, smartRender } from '../../utils';

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
    closeThread,
    fullWidth,
    loadMoreThread,
    Message: ThreadMessage,
    MessageInput: ThreadMessageInput,
    t,
    thread,
    threadHasMore,
    threadLoadingMore,
    threadMessages,
    ThreadHeader = DefaultThreadHeader,
  } = props;

  const messageList = useRef(null);
  const parentID = thread?.id;

  useEffect(() => {
    if (parentID && thread?.reply_count && loadMoreThread) {
      loadMoreThread();
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (messageList.current && threadMessages?.length) {
      // @ts-expect-error
      const { clientHeight, scrollTop, scrollHeight } = messageList.current;
      const scrollDown = clientHeight + scrollTop !== scrollHeight;

      if (scrollDown) {
        // @ts-expect-error
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
          // @ts-expect-error
          message={thread}
          initialMessage
          threadList
          Message={ThreadMessage}
          // TODO: remove the following line in next release, since we already have additionalParentMessageProps now.
          {...props}
          {...additionalParentMessageProps}
        />
        <div className="str-chat__thread-start">
          {t && t('Start of a new thread')}
        </div>
        <MessageList
          messages={threadMessages}
          read={read}
          threadList
          loadMore={loadMoreThread}
          hasMore={threadHasMore}
          loadingMore={threadLoadingMore}
          Message={ThreadMessage}
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

ThreadInner.propTypes = {
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  channel: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatReactClient['channel']>>} */ (PropTypes.objectOf(
    checkChannelPropType,
  ).isRequired),
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * The thread (the parent [message object](https://getstream.io/chat/docs/#message_format)) */
  thread: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatChannelState['messageToImmutable']> | null> } */ (PropTypes.object),
};

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
  const { channel, thread } = props;

  if (!thread || channel?.getConfig?.()?.replies === false) return null;

  // The wrapper ensures a key variable is set and the component recreates on thread switch
  return <ThreadInner {...props} key={`thread-${thread.id}-${channel?.cid}`} />;
};

Thread.propTypes = {
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth: PropTypes.bool,
  /** Make input focus on mounting thread */
  autoFocus: PropTypes.bool,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  channel: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatReactClient['channel']>>} */ (PropTypes.objectOf(
    checkChannelPropType,
  ).isRequired),
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  Message: /** @type {PropTypes.Validator<React.ComponentType<import('types').MessageUIComponentProps>>} */ (PropTypes.elementType),
  /** **UI component used to override the default header of the thread** */
  ThreadHeader: /** @type {PropTypes.Validator<React.ComponentType<import('types').ThreadHeaderProps>>} */ (PropTypes.elementType),
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * The thread (the parent [message object](https://getstream.io/chat/docs/#message_format)) */
  thread: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatChannelState['messageToImmutable']> | null> } */ (PropTypes.object),
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * The array of immutable messages to render. By default they are provided by parent Channel component */
  threadMessages:
    /** @type {PropTypes.Validator<import('seamless-immutable').ImmutableArray<ReturnType<import('types').StreamChatChannelState['messageToImmutable']>>>} */
    (PropTypes.array),
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   *
   * Function which provides next page of thread messages.
   * loadMoreThread is called when infinite scroll wants to load more messages
   * */
  loadMoreThread: PropTypes.func.isRequired,
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * If there are more messages available, set to false when the end of pagination is reached.
   * */
  threadHasMore: PropTypes.bool,
  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * If the thread is currently loading more messages. This is helpful to display a loading indicator on threadlist */
  threadLoadingMore: PropTypes.bool,
  /**
   * Additional props for underlying Message component of parent message at the top.
   * Available props - https://getstream.github.io/stream-chat-react/#message
   * */
  additionalParentMessageProps: PropTypes.object,
  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react/#messagelist
   * */
  additionalMessageListProps: PropTypes.object,
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
  /** Customized MessageInput component to used within Thread instead of default MessageInput
      Useable as follows:
      ```
      <Thread MessageInput={(props) => <MessageInput parent={props.parent} Input={MessageInputSmall} /> }/>
      ```
  */
  MessageInput: /** @type {PropTypes.Validator<React.ComponentType<import('types').MessageInputProps>>} */ (PropTypes.elementType),
};

Thread.defaultProps = {
  threadHasMore: true,
  threadLoadingMore: true,
  fullWidth: false,
  autoFocus: true,
  MessageInput,
};

export default withChannelContext(withTranslationContext(Thread));
