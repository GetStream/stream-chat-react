import React from 'react';

import { withChannelContext } from '../context';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import PropTypes from 'prop-types';

import { Message } from './Message';
import { MessageInputSmall } from './MessageInputSmall';

/**
 * Thread - The Thread renders a parent message with a list of replies. Use the stnadard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 *
 * @example ./docs/Thread.md
 * @extends Component
 */
class Thread extends React.PureComponent {
  static propTypes = {
    /** Channel is passed via the Channel Context */
    channel: PropTypes.object.isRequired,
    /** the thread (the parent message object) */
    thread: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),

    /** The message component to use for rendering messages */
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

    /** The list of messages to render, state is handled by the parent channel component */
    threadMessages: PropTypes.array.isRequired,

    /** loadMoreThread iss called when infinite scroll wants to load more messages */
    loadMoreThread: PropTypes.func.isRequired,

    /** If there are more messages available, set to false when the end of pagination is reached */
    threadHasMore: PropTypes.bool,
    /** If the thread is currently loading more messages */
    threadLoadingMore: PropTypes.bool,
    /** Display the thread on 100% width of it's container. Useful for mobile style view */
    fullWidth: PropTypes.bool,
  };

  static defaultProps = {
    threadHasMore: true,
    threadLoadingMore: true,
    fullWidth: false,
  };

  render() {
    if (!this.props.thread) {
      return null;
    }
    const parentID = this.props.thread.id;
    const cid = this.props.channel.cid;

    const key = `thread-${parentID}-${cid}`;
    // We use a wrapper to make sure the key variable is set.
    // this ensures that if you switch thread the component is recreated
    return <ThreadInner {...this.props} key={key} />;
  }
}

class ThreadInner extends React.PureComponent {
  static propTypes = {
    /** Channel is passed via the Channel Context */
    channel: PropTypes.object.isRequired,
    /** the thread (just a message) that we're rendering */
    thread: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messageList = React.createRef();
  }

  async componentDidMount() {
    const parentID = this.props.thread.id;
    if (parentID && this.props.thread.reply_count) {
      await this.props.loadMoreThread();
    }
  }
  getSnapshotBeforeUpdate(prevProps) {
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    if (prevProps.threadMessages.length < this.props.threadMessages.length) {
      const list = this.messageList.current;
      const pos = list.scrollHeight - list.scrollTop;
      return pos;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    if (snapshot !== null) {
      const list = this.messageList.current;

      const scrollDown = () => {
        list.scrollTop = list.scrollHeight - snapshot;
      };
      scrollDown();
      // scroll down after images load again
      setTimeout(scrollDown, 100);
    }
  }

  render() {
    if (!this.props.thread) {
      return null;
    }

    const seen = {};
    return (
      <div
        className={`str-chat__thread ${
          this.props.fullWidth ? 'str-chat__thread--full' : ''
        }`}
      >
        <div className="str-chat__thread-header">
          <div className="str-chat__thread-header-details">
            <strong>Thread</strong>
            <small>{this.props.thread.reply_count} replies</small>
          </div>
          <button
            onClick={(e) => this.props.closeThread(e)}
            className="str-chat__square-button"
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
            message={this.props.thread}
            initialMessage
            threadList
            Message={this.props.Message}
            {...this.props}
          />
          <div className="str-chat__thread-start">Start of a new thread</div>
          <MessageList
            messages={this.props.threadMessages}
            seen={seen}
            threadList
            loadMore={this.props.loadMoreThread}
            hasMore={this.props.threadHasMore}
            loadingMore={this.props.threadLoadingMore}
            Message={this.props.Message}
          />
          <MessageInput
            Input={MessageInputSmall}
            parent={this.props.thread}
            focus
          />
        </div>
      </div>
    );
  }
}

Thread = withChannelContext(Thread);
export { Thread };
