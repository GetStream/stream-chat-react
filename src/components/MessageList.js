import React, { PureComponent } from 'react';
import { Message } from './Message';
import { withChannelContext } from '../context';
import PropTypes from 'prop-types';
import { ReverseInfiniteScroll } from './ReverseInfiniteScroll';
import { MessageNotification } from './MessageNotification';
import { LoadingIndicator } from './LoadingIndicator';
import { DateSeparator } from './DateSeparator';
import { KEY_CODES } from './AutoCompleteTextarea';

/**
 * MessageList - The message list components renders a list of messages
 *
 * @example ./docs/MessageList.md
 * @extends PureComponent
 */
class MessageList extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      newMessagesNotification: false,
      editing: '',
      online: true,
    };

    this.bottomRef = React.createRef();
    this.messageList = React.createRef();
    this.messageRefs = {};
  }
  static propTypes = {
    /** The attachment component to render, defaults to Attachment */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** A list of immutable messages */
    messages: PropTypes.array.isRequired,
    /** Via Context: The channel object */
    channel: PropTypes.object.isRequired,
    /** Via Context: The function to update a message, handled by the Channel component */
    updateMessage: PropTypes.func.isRequired,
    /** Via Context: The function is called when the list scrolls */
    listenToScroll: PropTypes.func,
    /** Typing indicator component to render  */
    TypingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** Date separator component to render  */
    dateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** Turn off grouping of messages by user */
    noGroupByUser: PropTypes.bool,
  };

  static defaultProps = {
    dateSeparator: DateSeparator,
    noGroupByUser: false,
  };

  connectionChanged = (event) => {
    if (this.state.online !== event.online) {
      this.setState({ online: event.online });
    }
  };

  componentDidMount() {
    // start at the bottom
    this.scrollToBottom();
    const messageListRect = this.messageList.current.getBoundingClientRect();

    this.setState({
      messageListRect,
    });

    this.props.client.on('connection.changed', this.connectionChanged);

    document.addEventListener('keydown', this.keypress);
  }

  componentWillUnmount() {
    this.props.client.off('connection.changed', this.connectionChanged);

    document.removeEventListener('keydown', this.keypress);
  }

  getSnapshotBeforeUpdate(prevProps) {
    if (this.props.threadList) {
      return null;
    }
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    if (prevProps.messages.length < this.props.messages.length) {
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

      const scrollDownAgain = () => {
        this.scrollToTarget(this.bottomRef.current, this.messageList.current);
      };
      setTimeout(scrollDownAgain, 1000);
    }

    // handle new messages being sent/received
    const currentLastMessage = this.props.messages[
      this.props.messages.length - 1
    ];
    const previousLastMessage =
      prevProps.messages[prevProps.messages.length - 1];
    if (!previousLastMessage || !currentLastMessage) {
      return;
    }

    const hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
    const userScrolledUp = this.userScrolledUp();
    const isOwner = currentLastMessage.user.id === this.props.client.userID;

    let scrollToBottom = false;

    // always scroll down when it's your own message that you added...
    if (hasNewMessage && isOwner) {
      scrollToBottom = true;
    } else if (hasNewMessage && !userScrolledUp) {
      scrollToBottom = true;
    }

    if (scrollToBottom) {
      this.scrollToBottom();
    }

    // Check the scroll position... if you're scrolled up show a little notification
    if (
      !scrollToBottom &&
      hasNewMessage &&
      !this.state.newMessagesNotification
    ) {
      this.setState({ newMessagesNotification: true });
    }

    // remove the scroll notification if we already scrolled down...
    if (scrollToBottom && this.state.newMessagesNotification) {
      this.setState({ newMessagesNotification: false });
    }
  }

  keypress = (event) => {
    if (event.keyCode === KEY_CODES.ESC && this.state.editing) {
      this.clearEditingState();
    }
  };

  scrollToBottom = () => {
    this._scrollToRef(this.bottomRef, this.messageList);
  };

  _scrollToRef = (el, parent) => {
    function scrollDown() {
      if (el && el.current && parent && parent.current) {
        this.scrollToTarget(el.current, parent.current);
      }
    }
    scrollDown.call(this);
    // scroll down after images load again
    setTimeout(scrollDown.call(this), 100);
  };

  /**
   * target - target to scroll to (DOM element, scrollTop Number, 'top', or 'bottom'
   * containerEl - DOM element for the container with scrollbars
   * source: https://stackoverflow.com/a/48429314
   */
  scrollToTarget = (target, containerEl) => {
    // Moved up here for readability:
    const isElement = target && target.nodeType === 1,
      isNumber = Object.prototype.toString.call(target) === '[object Number]';

    if (isElement) {
      containerEl.scrollTop = target.offsetTop;
    } else if (isNumber) {
      containerEl.scrollTop = target;
    } else if (target === 'bottom') {
      containerEl.scrollTop =
        containerEl.scrollHeight - containerEl.offsetHeight;
    } else if (target === 'top') {
      containerEl.scrollTop = 0;
    }
  };

  setEditingState = (message) => {
    this.setState({
      editing: message.id,
    });
  };

  clearEditingState = (e) => {
    if (e) {
      e.preventDefault();
    }
    this.setState({
      editing: '',
    });
  };

  insertDates = (messages) => {
    const newMessages = [];
    for (const [i, message] of messages.entries()) {
      if (message.type === 'message.read' || message.deleted_at) {
        newMessages.push(message);
        continue;
      }
      const messageDate = message.created_at.getDay();
      let prevMessageDate = messageDate;
      if (i > 0) {
        prevMessageDate = messages[i - 1].created_at.getDay();
      }

      if (i === 0) {
        newMessages.push(
          { type: 'message.date', date: message.created_at },
          message,
        );
      } else if (messageDate !== prevMessageDate) {
        newMessages.push(
          { type: 'message.date', date: message.created_at },
          message,
        );
      } else {
        newMessages.push(message);
      }
    }
    return newMessages;
  };

  goToNewMessages = async () => {
    await this.scrollToBottom();
    this.setState({
      newMessagesNotification: false,
    });
  };

  getReadStates = (messages) => {
    // create object with empty array for each message id
    const readData = {};
    for (const message of messages) {
      readData[message.id] = [];
    }

    // get all the read events
    const readEvents = Object.values(this.props.read);

    // match readevents with lastMessageId with the correct id
    for (const event of readEvents) {
      if (event.lastMessageID) {
        readData[event.lastMessageID] = [
          ...readData[event.lastMessageID],
          event.user,
        ];
      }
    }

    return readData;
  };

  userScrolledUp = () => this.scrollOffset > 310;

  listenToScroll = (offset) => {
    this.scrollOffset = offset;

    if (this.state.newMessagesNotification && !this.userScrolledUp()) {
      this.setState({
        newMessagesNotification: false,
      });
    }
  };

  getLastReceived = (messages) => {
    const l = messages.length;
    let lastReceivedId = null;
    for (let i = l; i > 0; i--) {
      if (
        messages[i] !== undefined &&
        messages[i].status !== undefined &&
        messages[i].status === 'received'
      ) {
        lastReceivedId = messages[i].id;
        break;
      }
    }
    return lastReceivedId;
  };

  getGroupStyles = (m) => {
    const l = m.length;
    const messageGroupStyles = {};

    const messages = [...m];

    for (let i = 0; i < l; i++) {
      const previousMessage = messages[i - 1];
      const message = messages[i];
      const nextMessage = messages[i + 1];
      const groupStyles = [];
      if (message.type === 'message.date') {
        continue;
      }
      const userId = message.user.id;

      const isTopMessage =
        !previousMessage ||
        previousMessage.type === 'message.date' ||
        previousMessage.attachments.length !== 0 ||
        userId !== previousMessage.user.id ||
        previousMessage.type === 'error' ||
        previousMessage.deleted_at;

      const isBottomMessage =
        !nextMessage ||
        nextMessage.type === 'message.date' ||
        nextMessage.attachments.length !== 0 ||
        userId !== nextMessage.user.id ||
        nextMessage.type === 'error' ||
        nextMessage.deleted_at;

      if (isTopMessage) {
        groupStyles.push('top');
      }

      if (isBottomMessage) {
        if (isTopMessage || message.deleted_at || message.type === 'error') {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('single');
        } else {
          groupStyles.push('bottom');
        }
      }

      if (!isTopMessage && !isBottomMessage) {
        if (message.deleted_at || message.type === 'error') {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('single');
        } else {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('middle');
        }
      }

      if (message.attachments.length !== 0) {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      }

      if (this.props.noGroupByUser) {
        groupStyles.splice(0, groupStyles.length);
        groupStyles.push('single');
      }

      messageGroupStyles[message.id || message.tmp_id] = groupStyles;
    }

    return messageGroupStyles;
  };

  render() {
    let allMessages = [...this.props.messages];

    allMessages = this.insertDates(allMessages);

    const messageGroupStyles = this.getGroupStyles(allMessages);

    const TypingIndicator = this.props.typingIndicator;
    const DateSeparator = this.props.dateSeparator;

    // sort by date
    allMessages.sort(function(a, b) {
      return a.created_at - b.created_at;
    });

    // get the readData
    const readData = this.getReadStates(allMessages);

    const lastReceivedId = this.getLastReceived(allMessages);
    const elements = [];

    // loop over the messages
    for (const message of allMessages) {
      if (message.id) {
        this.messageRefs[message.id] = React.createRef();
      }

      if (message.type === 'message.date') {
        if (this.props.threadList) {
          continue;
        }
        elements.push(
          <li key={message.date.toISOString() + '-i'}>
            <DateSeparator date={message.date} />
          </li>,
        );
      } else if (message.type !== 'message.read') {
        let groupStyles = messageGroupStyles[message.id || message.tmp_id];
        if (!groupStyles) {
          groupStyles = [];
        }
        const readBy = readData[message.id] || [];

        elements.push(
          <li
            className={`str-chat__li str-chat__li--${groupStyles}`}
            key={message.id || message.tmp_id || message.created_at}
            ref={this.messageRefs[message.id]}
          >
            <Message
              client={this.props.client}
              openThread={this.props.openThread}
              members={this.props.members}
              watchers={this.props.watchers}
              message={message}
              groupStyles={groupStyles}
              readBy={readBy}
              lastReceivedId={
                lastReceivedId === message.id ? lastReceivedId : null
              }
              editing={
                !!(this.state.editing && this.state.editing === message.id)
              }
              channel={this.props.channel}
              threadList={this.props.threadList}
              clearEditingState={this.clearEditingState}
              setEditingState={this.setEditingState}
              messageListRect={this.state.messageListRect}
              retrySendMessage={this.props.retrySendMessage}
              updateMessage={this.props.updateMessage}
              removeMessage={this.props.removeMessage}
              Message={this.props.Message}
              Attachment={this.props.Attachment}
            />
          </li>,
        );
      }
    }
    return (
      <React.Fragment>
        <div
          className={`str-chat__list ${
            this.props.threadList ? 'str-chat__list--thread' : ''
          }`}
          ref={this.messageList}
        >
          <ReverseInfiniteScroll
            loadMore={this.props.loadMore}
            hasMore={this.props.hasMore}
            isLoading={this.props.loadingMore}
            listenToScroll={this.listenToScroll}
            useWindow={false}
            loader={
              <Center key="loadingindicator">
                <LoadingIndicator size={20} />
              </Center>
            }
          >
            <ul className="str-chat__ul">{elements}</ul>
            {this.props.typingIndicator && (
              <TypingIndicator
                typing={this.props.typing}
                client={this.props.client}
              />
            )}
            <div key="bottom" ref={this.bottomRef} />
          </ReverseInfiniteScroll>
        </div>

        <div className="str-chat__list-notifications">
          <Notification active={!this.state.online}>
            Connection failure, reconnecting now...
          </Notification>

          <MessageNotification
            showNotification={this.state.newMessagesNotification}
            onClick={() => this.goToNewMessages()}
          >
            New Messages!
          </MessageNotification>
        </div>
      </React.Fragment>
    );
  }
}

MessageList = withChannelContext(MessageList);
export { MessageList };

const Center = ({ children }) => (
  <div style={{ width: 100 + '%', display: 'flex', justifyContent: 'center' }}>
    {children}
  </div>
);

const Notification = ({ children, active }) => {
  if (active) {
    return <div className="str-chat__connection-issue">{children}</div>;
  }
  return null;
};
