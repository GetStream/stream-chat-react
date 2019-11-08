import React, { PureComponent } from 'react';
import { Message } from './Message';
import { withChannelContext } from '../context';
import PropTypes from 'prop-types';
import { EmptyStateIndicator } from './EmptyStateIndicator';
import { ReverseInfiniteScroll } from './ReverseInfiniteScroll';
import { MessageNotification } from './MessageNotification';
import { MessageSimple } from './MessageSimple';
import { Attachment } from './Attachment';
import { LoadingIndicator } from './LoadingIndicator';
import { DateSeparator } from './DateSeparator';
import { EventComponent } from './EventComponent';
import { KEY_CODES } from './AutoCompleteTextarea';
import deepequal from 'deep-equal';
import { MESSAGE_ACTIONS } from '../utils';

/* eslint sonarjs/no-duplicate-string: 0 */

/**
 * MessageList - The message list components renders a list of messages. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
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
      notifications: [],
    };

    this.bottomRef = React.createRef();
    this.messageList = React.createRef();
    this.messageRefs = {};
    this.notificationTimeouts = [];
  }
  static propTypes = {
    /**
     * Typing indicator UI component to render
     *
     * Defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator.js)
     * */
    TypingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Date separator UI component to render
     *
     * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.js)
     * */
    dateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** Turn off grouping of messages by user */
    noGroupByUser: PropTypes.bool,
    /** render HTML instead of markdown. Posting HTML is only allowed server-side */
    unsafeHTML: PropTypes.bool,
    /** Set the limit to use when paginating messages */
    messageLimit: PropTypes.number,
    /**
     * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
     * If all the actions need to be disabled, empty array or false should be provided as value of prop.
     * */
    messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    /**
     * Boolean weather current message list is a thread.
     */
    threadList: PropTypes.bool,
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageSuccessNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageErrorNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserSuccessNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserErrorNotification: PropTypes.func,
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    client: PropTypes.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * The UI Indicator to use when MessagerList or ChannelList is empty
     * */
    EmptyStateIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Component to render at the top of the MessageList
     * */
    HeaderComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    messages: PropTypes.array.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    channel: PropTypes.object.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    updateMessage: PropTypes.func.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    retrySendMessage: PropTypes.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    removeMessage: PropTypes.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    onMentionsClick: PropTypes.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    onMentionsHover: PropTypes.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    openThread: PropTypes.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    members: PropTypes.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    watchers: PropTypes.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    read: PropTypes.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    typing: PropTypes.object,
  };

  static defaultProps = {
    Message: MessageSimple,
    threadList: false,
    Attachment,
    dateSeparator: DateSeparator,
    EmptyStateIndicator,
    unsafeHTML: false,
    noGroupByUser: false,
    messageActions: Object.keys(MESSAGE_ACTIONS),
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
    this.notificationTimeouts.forEach((ct) => {
      clearTimeout(ct);
    });
  }

  getSnapshotBeforeUpdate(prevProps) {
    if (this.props.threadList) {
      return null;
    }
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.

    if (
      prevProps.messages.length < this.props.messages.length ||
      !deepequal(this.props.eventHistory, prevProps.eventHistory)
    ) {
      const list = this.messageList.current;
      return {
        offsetTop: list.scrollTop,
        offsetBottom: list.scrollHeight - list.scrollTop,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    const userScrolledUp = this.userScrolledUp();
    const currentLastMessage = this.props.messages[
      this.props.messages.length - 1
    ];
    const previousLastMessage =
      prevProps.messages[prevProps.messages.length - 1];
    if (!previousLastMessage || !currentLastMessage) {
      return;
    }

    const hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
    const isOwner = currentLastMessage.user.id === this.props.client.userID;

    const list = this.messageList.current;

    // always scroll down when it's your own message that you added...
    const scrollToBottom = hasNewMessage && (isOwner || !userScrolledUp);

    if (scrollToBottom) {
      this.scrollToBottom();
      // Scroll further once attachments are laoded.
      setTimeout(this.scrollToBottom, 100);

      // remove the scroll notification if we already scrolled down...
      this.state.newMessagesNotification &&
        this.setState({ newMessagesNotification: false });

      return;
    }

    if (snapshot !== null) {
      // Maintain the offsetTop of scroll so that content in viewport doesn't move.
      // This is for the case where user has scroll up significantly and a new message arrives from someone.
      if (hasNewMessage) {
        this.scrollToTarget(snapshot.offsetTop, this.messageList.current);
      } else {
        // Maintain the bottomOffset of scroll.
        // This is for the case of pagination, when more messages get loaded.
        this.scrollToTarget(
          list.scrollHeight - snapshot.offsetBottom,
          this.messageList.current,
        );
      }
    }

    // Check the scroll position... if you're scrolled up show a little notification
    if (hasNewMessage && !this.state.newMessagesNotification) {
      this.setState({ newMessagesNotification: true });
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
    setTimeout(scrollDown.bind(this), 200);
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

      if (i === 0 || messageDate !== prevMessageDate) {
        newMessages.push(
          { type: 'message.date', date: message.created_at },
          message,
        );
      } else {
        newMessages.push(message);
      }

      const eventsNextToMessage = this.props.eventHistory[
        message.id || 'first'
      ];
      if (eventsNextToMessage && eventsNextToMessage.length > 0) {
        eventsNextToMessage.forEach((e) => {
          newMessages.push({
            type: 'channel.event',
            event: e,
          });
        });
      }
    }

    return newMessages;
  };

  insertIntro = (messages) => {
    const newMessages = messages || [];
    // if no headerPosition is set, HeaderComponent will go at the top
    if (!this.props.headerPosition) {
      newMessages.unshift({
        type: 'channel.intro',
        // created_at: new Date(0),
      });
      return newMessages;
    }

    // if no messages, intro get's inserted
    if (!newMessages.length) {
      newMessages.unshift({
        type: 'channel.intro',
      });
      return newMessages;
    }

    // else loop over the messages
    for (const [i, message] of messages.entries()) {
      const messageTime = message.created_at
        ? message.created_at.getTime()
        : null;
      const nextMessageTime =
        messages[i + 1] && messages[i + 1].created_at
          ? messages[i + 1].created_at.getTime()
          : null;
      const { headerPosition } = this.props;

      // headerposition is smaller than message time so comes after;
      if (messageTime < headerPosition) {
        // if header position is also smaller than message time continue;
        if (nextMessageTime < headerPosition) {
          if (messages[i + 1] && messages[i + 1].type === 'message.date')
            continue;
          if (!nextMessageTime) {
            newMessages.push({ type: 'channel.intro' });
            return newMessages;
          }
          continue;
        } else {
          newMessages.splice(i + 1, 0, { type: 'channel.intro' });
          return newMessages;
        }
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

    for (const readState of Object.values(this.props.read)) {
      if (readState.last_read == null) {
        break;
      }
      let userLastReadMsgId;
      for (const msg of messages) {
        if (msg.updated_at < readState.last_read) {
          userLastReadMsgId = msg.id;
        }
      }
      if (userLastReadMsgId != null) {
        readData[userLastReadMsgId] = [
          ...readData[userLastReadMsgId],
          readState.user,
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

      if (message.type === 'channel.event') {
        continue;
      }

      if (message.type === 'channel.intro') {
        continue;
      }

      const userId = message.user.id;

      const isTopMessage =
        !previousMessage ||
        previousMessage.type === 'channel.intro' ||
        previousMessage.type === 'message.date' ||
        previousMessage.type === 'system' ||
        previousMessage.type === 'channel.event' ||
        previousMessage.attachments.length !== 0 ||
        userId !== previousMessage.user.id ||
        previousMessage.type === 'error' ||
        previousMessage.deleted_at;

      const isBottomMessage =
        !nextMessage ||
        nextMessage.type === 'message.date' ||
        nextMessage.type === 'system' ||
        nextMessage.type === 'channel.event' ||
        nextMessage.type === 'channel.intro' ||
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

      messageGroupStyles[message.id] = groupStyles;
    }

    return messageGroupStyles;
  };

  _onMentionsHoverOrClick = (e, mentioned_users) => {
    if (!this.props.onMentionsHover || !this.props.onMentionsClick) return;

    const tagName = e.target.tagName.toLowerCase();
    const textContent = e.target.innerHTML.replace('*', '');
    if (tagName === 'strong' && textContent[0] === '@') {
      const userName = textContent.replace('@', '');
      const user = mentioned_users.find(
        (user) => user.name === userName || user.id === userName,
      );
      if (this.props.onMentionsHover && e.type === 'mouseover') {
        this.props.onMentionsHover(e, user);
      }
      if (this.props.onMentionsClick && e.type === 'click') {
        this.props.onMentionsHover(e, user);
      }
    }
  };

  /**
   * Adds a temporary notification to message list.
   * Notification will be removed after 5 seconds.
   *
   * @param notificationText  Text of notification to be added
   * @param type              Type of notification. success | error
   */
  addNotification = (notificationText, type) => {
    if (typeof notificationText !== 'string') return;
    if (type !== 'success' && type !== 'error') return;

    const nextIndex = new Date();

    const newNotifications = [...this.state.notifications];
    newNotifications.push({
      id: nextIndex,
      text: notificationText,
      type,
    });
    this.setState({
      notifications: newNotifications,
    });

    // remove the notification after 5000 ms
    const ct = setTimeout(() => {
      const index = this.state.notifications.findIndex((notification) => {
        if (notification.id === nextIndex) return true;
        return false;
      });
      const newNotifications = [...this.state.notifications];
      newNotifications.splice(index, 1);
      this.setState({
        notifications: newNotifications,
      });
    }, 5000);

    this.notificationTimeouts.push(ct);
  };

  _loadMore = () =>
    this.props.messageLimit
      ? this.props.loadMore(this.props.messageLimit)
      : this.props.loadMore();

  // eslint-disable-next-line
  render() {
    let allMessages = [...this.props.messages];

    allMessages = this.insertDates(allMessages);
    if (this.props.HeaderComponent) {
      allMessages = this.insertIntro(allMessages);
    }
    const messageGroupStyles = this.getGroupStyles(allMessages);

    const {
      TypingIndicator,
      dateSeparator: DateSeparator,
      HeaderComponent,
      EmptyStateIndicator,
    } = this.props;

    // sort by date
    allMessages.sort((a, b) => a.created_at - b.created_at);

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
      } else if (message.type === 'channel.intro') {
        elements.push(
          <li key="intro">
            <HeaderComponent />
          </li>,
        );
      } else if (
        message.type === 'channel.event' ||
        message.type === 'system'
      ) {
        elements.push(
          <li
            key={
              message.type === 'system'
                ? message.created_at
                : message.type === 'channel.event'
                ? message.event.created_at
                : ''
            }
          >
            <EventComponent message={message} />
          </li>,
        );
      } else if (message.type !== 'message.read') {
        let groupStyles = messageGroupStyles[message.id];
        if (!groupStyles) {
          groupStyles = [];
        }
        const readBy = readData[message.id] || [];

        elements.push(
          <li
            className={`str-chat__li str-chat__li--${groupStyles}`}
            key={message.id || message.created_at}
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
              clearEditingState={this.clearEditingState}
              setEditingState={this.setEditingState}
              messageListRect={this.state.messageListRect}
              channel={this.props.channel}
              threadList={this.props.threadList}
              retrySendMessage={this.props.retrySendMessage}
              addNotification={this.addNotification}
              updateMessage={this.props.updateMessage}
              removeMessage={this.props.removeMessage}
              Message={this.props.Message}
              unsafeHTML={this.props.unsafeHTML}
              Attachment={this.props.Attachment}
              onMentionsClick={this.props.onMentionsClick}
              onMentionsHover={this.props.onMentionsHover}
              messageActions={this.props.messageActions}
              getFlagMessageSuccessNotification={
                this.props.getFlagMessageSuccessNotification
              }
              getFlagMessageErrorNotification={
                this.props.getFlagMessageErrorNotification
              }
              getMuteUserSuccessNotification={
                this.props.getMuteUserSuccessNotification
              }
              getMuteUserErrorNotification={
                this.props.getMuteUserErrorNotification
              }
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
          {!elements.length ? (
            <EmptyStateIndicator listType="message" />
          ) : (
            <ReverseInfiniteScroll
              loadMore={this._loadMore}
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
              {this.props.TypingIndicator && (
                <TypingIndicator
                  typing={this.props.typing}
                  client={this.props.client}
                />
              )}
              <div key="bottom" ref={this.bottomRef} />
            </ReverseInfiniteScroll>
          )}
        </div>

        <div className="str-chat__list-notifications">
          {this.state.notifications.map((notification) => (
            <Notification
              active={true}
              key={notification.id}
              type={notification.type}
            >
              {notification.text}
            </Notification>
          ))}
          <Notification active={!this.state.online} type="error">
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

const Notification = ({ children, active, type }) => {
  if (active) {
    return (
      <div className={`str-chat__custom-notification notification-${type}`}>
        {children}
      </div>
    );
  }
  return null;
};
