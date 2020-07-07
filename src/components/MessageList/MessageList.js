/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/cognitive-complexity */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import deepequal from 'react-fast-compare';
import { v4 as uuidv4 } from 'uuid';

import Center from './Center';
import MessageNotification from './MessageNotification';
import CustomNotification from './CustomNotification';
import { MESSAGE_ACTIONS } from '../Message/utils';
import { smartRender } from '../../utils';

import { ChannelContext, withTranslationContext } from '../../context';
import { Attachment } from '../Attachment';
import { Message, MessageSimple } from '../Message';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScroll } from '../InfiniteScrollPaginator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { EventComponent } from '../EventComponent';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { KEY_CODES } from '../AutoCompleteTextarea';

/**
 * MessageList - The message list components renders a list of messages. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 *
 * @example ../../docs/MessageList.md
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

  connectionChanged = ({ online }) => {
    if (this.state.online !== online) this.setState({ online });
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
    this.notificationTimeouts.forEach(clearTimeout);
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

      // remove the scroll notification if we already scrolled down...
      if (this.state.newMessagesNotification)
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
    const scrollDown = () => {
      if (el && el.current && parent && parent.current) {
        this.scrollToTarget(el.current, parent.current);
      }
    };

    scrollDown();
    // scroll down after images load again
    setTimeout(scrollDown, 200);
  };

  /**
   * target - target to scroll to (DOM element, scrollTop Number, 'top', or 'bottom'
   * containerEl - DOM element for the container with scrollbars
   * source: https://stackoverflow.com/a/48429314
   */
  scrollToTarget = (target, containerEl) => {
    // Moved up here for readability:
    const isElement = target && target.nodeType === 1;
    const isNumber =
      Object.prototype.toString.call(target) === '[object Number]';

    let scrollTop;
    if (isElement) scrollTop = target.offsetTop;
    else if (isNumber) scrollTop = target;
    else if (target === 'top') scrollTop = 0;
    else if (target === 'bottom')
      scrollTop = containerEl.scrollHeight - containerEl.offsetHeight;

    if (scrollTop !== undefined) containerEl.scrollTop = scrollTop; // eslint-disable-line no-param-reassign
  };

  setEditingState = (message) => {
    this.setState({ editing: message.id });
  };

  clearEditingState = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    this.setState({ editing: '' });
  };

  insertDates = (messages) => {
    const newMessages = [];
    for (const [i, message] of messages.entries()) {
      if (message.type === 'message.read') {
        newMessages.push(message);
        continue;
      }
      const messageDate = message.created_at.toDateString();
      let prevMessageDate = messageDate;
      if (i > 0) {
        prevMessageDate = messages[i - 1].created_at.toDateString();
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
      newMessages.unshift({ type: 'channel.intro' });
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

  goToNewMessages = () => {
    this.scrollToBottom();
    this.setState({ newMessagesNotification: false });
  };

  getReadStates = (messages) => {
    // create object with empty array for each message id
    const readData = {};
    messages.forEach((message) => {
      if (!message || !message.id) return;
      readData[message.id] = [];
    });

    Object.values(this.props.read).forEach((readState) => {
      if (readState.last_read == null) return;

      let userLastReadMsgId;
      for (const msg of messages) {
        if (msg.updated_at < readState.last_read) {
          userLastReadMsgId = msg.id;
        }
      }
      if (userLastReadMsgId) {
        readData[userLastReadMsgId] = [
          ...readData[userLastReadMsgId],
          readState.user,
        ];
      }
    });

    return readData;
  };

  userScrolledUp = () => this.scrollOffset > 310;

  listenToScroll = (offset) => {
    this.scrollOffset = offset;
    if (this.state.newMessagesNotification && !this.userScrolledUp()) {
      this.setState({ newMessagesNotification: false });
    }
  };

  getLastReceived = (messages) => {
    for (let i = messages.length; i > 0; i -= 1) {
      if (messages[i] && messages[i].status === 'received') {
        return messages[i].id;
      }
    }
    return null;
  };

  getGroupStyles = (messages) => {
    const messageGroupStyles = {};

    for (let i = 0, l = messages.length; i < l; i += 1) {
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
        (u) => u.name === userName || u.id === userName,
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

    const id = uuidv4();

    this.setState(({ notifications }) => ({
      notifications: [...notifications, { id, text: notificationText, type }],
    }));

    // remove the notification after 5000 ms
    const ct = setTimeout(
      () =>
        this.setState(({ notifications }) => ({
          notifications: notifications.filter((n) => n.id !== id),
        })),
      5000,
    );

    this.notificationTimeouts.push(ct);
  };

  _loadMore = () => {
    return this.props.messageLimit
      ? this.props.loadMore(this.props.messageLimit)
      : this.props.loadMore();
  };

  _onMessageLoadCaptured = () => {
    // A load event (emitted by e.g. an <img>) was captured on a message.
    // In some cases, the loaded asset is larger than the placeholder, which means we have to scroll down.
    if (!this.userScrolledUp()) {
      this.scrollToBottom();
    }
  };

  render() {
    let allMessages = [...this.props.messages];
    const { MessageSystem, LoadingIndicator } = this.props;
    allMessages = this.insertDates(allMessages);
    if (this.props.HeaderComponent) {
      allMessages = this.insertIntro(allMessages);
    }
    const messageGroupStyles = this.getGroupStyles(allMessages);

    const DateSeparator = this.props.DateSeparator || this.props.dateSeparator; // backward compatibility
    const { HeaderComponent, EmptyStateIndicator, t } = this.props;

    // sort by date
    allMessages.sort((a, b) => a.created_at - b.created_at);

    // get the readData, but only for messages submitted by the user themselves
    const readData = this.getReadStates(
      allMessages.filter(
        ({ user }) => user && user.id === this.props.client.userID,
      ),
    );

    const lastReceivedId = this.getLastReceived(allMessages);
    const elements = [];

    // loop over the messages
    allMessages.forEach((message) => {
      if (message.id) {
        this.messageRefs[message.id] = React.createRef();
      }

      if (message.type === 'message.date') {
        if (this.props.threadList) {
          return;
        }
        elements.push(
          <li key={`${message.date.toISOString()}-i`}>
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
        if (MessageSystem)
          elements.push(
            <li
              key={
                // eslint-disable-next-line no-nested-ternary
                message.type === 'system'
                  ? message.created_at
                  : message.type === 'channel.event'
                  ? message.event.created_at
                  : ''
              }
            >
              <MessageSystem message={message} />
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
            onLoadCapture={this._onMessageLoadCaptured}
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
              mutes={this.props.mutes}
              unsafeHTML={this.props.unsafeHTML}
              Attachment={this.props.Attachment}
              onMentionsClick={this.props.onMentionsClick}
              onMentionsHover={this.props.onMentionsHover}
              messageActions={this.props.messageActions}
              additionalMessageInputProps={
                this.props.additionalMessageInputProps
              }
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
    });

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
            <InfiniteScroll
              isReverse
              loadMore={this._loadMore}
              hasMore={this.props.hasMore}
              isLoading={this.props.loadingMore}
              listenToScroll={this.listenToScroll}
              useWindow={false}
              loader={
                <Center key="loadingindicator">
                  {smartRender(LoadingIndicator, { size: 20 }, null)}
                </Center>
              }
              className="str-chat__reverse-infinite-scroll"
              data-testid="reverse-infinite-scroll"
            >
              <ul className="str-chat__ul">{elements}</ul>

              <div key="bottom" ref={this.bottomRef} />
            </InfiniteScroll>
          )}
        </div>

        <div className="str-chat__list-notifications">
          {this.state.notifications.map((notification) => (
            <CustomNotification
              active={true}
              key={notification.id}
              type={notification.type}
            >
              {notification.text}
            </CustomNotification>
          ))}
          <CustomNotification active={!this.state.online} type="error">
            {t('Connection failure, reconnecting now...')}
          </CustomNotification>

          <MessageNotification
            showNotification={this.state.newMessagesNotification}
            onClick={this.goToNewMessages}
          >
            {t('New Messages!')}
          </MessageNotification>
        </div>
      </React.Fragment>
    );
  }
}

MessageList.propTypes = {
  /**
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.js)
   * */
  dateSeparator: PropTypes.elementType,
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
  Attachment: PropTypes.elementType,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  Message: PropTypes.elementType,
  /**
   * Custom UI component to display system messages.
   *
   * Defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.js)
   */
  MessageSystem: PropTypes.elementType,
  /**
   * The UI Indicator to use when MessagerList or ChannelList is empty
   * */
  EmptyStateIndicator: PropTypes.elementType,
  /**
   * Component to render at the top of the MessageList
   * */
  HeaderComponent: PropTypes.elementType,
  /**
   * Component to render at the top of the MessageList while loading new messages
   * */
  LoadingIndicator: PropTypes.elementType,
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
  /**
   * Additional props for underlying MessageInput component. We have instance of MessageInput
   * component in MessageSimple component, for handling edit state.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
};

MessageList.defaultProps = {
  Message: MessageSimple,
  MessageSystem: EventComponent,
  threadList: false,
  Attachment,
  DateSeparator: DefaultDateSeparator,
  LoadingIndicator: DefaultLoadingIndicator,
  EmptyStateIndicator: DefaultEmptyStateIndicator,
  unsafeHTML: false,
  noGroupByUser: false,
  messageActions: Object.keys(MESSAGE_ACTIONS),
};

export default withTranslationContext((props) => (
  <ChannelContext.Consumer>
    {/* TODO: only used props needs to be passed in */}
    {({ typing, ...channelContext }) => (
      <MessageList {...channelContext} {...props} />
    )}
  </ChannelContext.Consumer>
));
