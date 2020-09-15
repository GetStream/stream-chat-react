// @ts-check
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { checkChannelPropType, smartRender } from '../../utils';
import { withChannelContext, withTranslationContext } from '../../context';
import { Message } from '../Message';
import { MessageList } from '../MessageList';
import { MessageInput, MessageInputSmall } from '../MessageInput';

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ../../docs/Thread.md
 * @typedef {Omit<import('types').ThreadProps & import('types').ChannelContextValue & import('types').TranslationContextValue, 'client'>} Props
 * @extends PureComponent<Props, any>
 */
class Thread extends PureComponent {
  static propTypes = {
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

  static defaultProps = {
    threadHasMore: true,
    threadLoadingMore: true,
    fullWidth: false,
    autoFocus: true,
    MessageInput,
  };

  render() {
    if (!this.props.thread) {
      return null;
    }
    const parentID = this.props.thread.id;
    const cid = this.props.channel && this.props.channel.cid;

    const key = `thread-${parentID}-${cid}`;
    // We use a wrapper to make sure the key variable is set.
    // this ensures that if you switch thread the component is recreated
    return <ThreadInner {...this.props} key={key} />;
  }
}

/** @extends {PureComponent<Props, any>} */
class ThreadInner extends React.PureComponent {
  static propTypes = {
    /** Channel is passed via the Channel Context */
    channel: PropTypes.object.isRequired,
    /** the thread (just a message) that we're rendering */
    thread: PropTypes.object.isRequired,
  };

  /** @param { any } props */
  constructor(props) {
    super(props);
    this.messageList = React.createRef();
  }

  componentDidMount() {
    const { thread, loadMoreThread } = this.props;
    const parentID = thread && thread.id;
    if (parentID && thread?.reply_count && loadMoreThread) {
      loadMoreThread();
    }
  }

  /** @param {Props} prevProps */
  getSnapshotBeforeUpdate(prevProps) {
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    if (
      prevProps.threadMessages &&
      this.props.threadMessages &&
      prevProps.threadMessages.length < this.props.threadMessages.length
    ) {
      const list = this.messageList.current;
      return list.clientHeight + list.scrollTop === list.scrollHeight;
    }
    return null;
  }

  /**
   * @param {Props} prevProps
   * @param {any} prevState
   * @param {number} snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    const { thread, threadMessages, loadMoreThread } = this.props;
    const parentID = thread?.id;

    if (
      parentID &&
      thread?.reply_count &&
      thread.reply_count > 0 &&
      threadMessages?.length === 0 &&
      loadMoreThread
    ) {
      loadMoreThread();
    }

    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    if (snapshot !== null) {
      const scrollDown = () => {
        const list = this.messageList.current;
        if (snapshot) list.scrollTop = list.scrollHeight;
      };
      scrollDown();
      // scroll down after images load again
      setTimeout(scrollDown, 100);
    }
  }

  render() {
    const { t, closeThread, thread } = this.props;

    if (!thread) {
      return null;
    }

    const read = {};
    return (
      <div
        className={`str-chat__thread ${
          this.props.fullWidth ? 'str-chat__thread--full' : ''
        }`}
      >
        <div className="str-chat__thread-header">
          <div className="str-chat__thread-header-details">
            <strong>{t && t('Thread')}</strong>
            <small>
              {' '}
              {t &&
                t('{{ replyCount }} replies', {
                  replyCount: thread.reply_count,
                })}
            </small>
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
        <div className="str-chat__thread-list" ref={this.messageList}>
          <Message
            // @ts-ignore
            message={thread}
            initialMessage
            threadList
            Message={this.props.Message}
            // TODO: remove the following line in next release, since we already have additionalParentMessageProps now.
            {...this.props}
            {...this.props.additionalParentMessageProps}
          />
          <div className="str-chat__thread-start">
            {t && t('Start of a new thread')}
          </div>
          <MessageList
            messages={this.props.threadMessages}
            read={read}
            threadList
            loadMore={this.props.loadMoreThread}
            hasMore={this.props.threadHasMore}
            loadingMore={this.props.threadLoadingMore}
            Message={this.props.Message}
            {...this.props.additionalMessageListProps}
          />
        </div>
        {smartRender(this.props.MessageInput, {
          Input: MessageInputSmall,
          parent: this.props.thread,
          focus: this.props.autoFocus,
          publishTypingEvent: false,
          ...this.props.additionalMessageInputProps,
        })}
      </div>
    );
  }
}

export default withChannelContext(withTranslationContext(Thread));
