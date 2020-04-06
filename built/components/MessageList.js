'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function(resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function() {
          return this;
        }),
      g
    );
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __spreadArrays =
  (this && this.__spreadArrays) ||
  function() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++)
      s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
        r[k] = a[j];
    return r;
  };
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importStar(require('react'));
var Message_1 = require('./Message');
var context_1 = require('../context');
var prop_types_1 = __importDefault(require('prop-types'));
var EmptyStateIndicator_1 = require('./EmptyStateIndicator');
var ReverseInfiniteScroll_1 = require('./ReverseInfiniteScroll');
var MessageNotification_1 = require('./MessageNotification');
var MessageSimple_1 = require('./MessageSimple');
var Attachment_1 = require('./Attachment');
var LoadingIndicator_1 = require('./LoadingIndicator');
var DateSeparator_1 = require('./DateSeparator');
var EventComponent_1 = require('./EventComponent');
var AutoCompleteTextarea_1 = require('./AutoCompleteTextarea');
var deep_equal_1 = __importDefault(require('deep-equal'));
var utils_1 = require('../utils');
/* eslint sonarjs/no-duplicate-string: 0 */
/**
 * MessageList - The message list components renders a list of messages. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 *
 * @example ./docs/MessageList.md
 * @extends PureComponent
 */
var MessageList = /** @class */ (function(_super) {
  __extends(MessageList, _super);
  function MessageList(props) {
    var _this = _super.call(this, props) || this;
    _this.connectionChanged = function(event) {
      if (_this.state.online !== event.online) {
        _this.setState({ online: event.online });
      }
    };
    _this.keypress = function(event) {
      if (
        event.keyCode === AutoCompleteTextarea_1.KEY_CODES.ESC &&
        _this.state.editing
      ) {
        _this.clearEditingState();
      }
    };
    _this.scrollToBottom = function() {
      _this._scrollToRef(_this.bottomRef, _this.messageList);
    };
    _this._scrollToRef = function(el, parent) {
      function scrollDown() {
        if (el && el.current && parent && parent.current) {
          this.scrollToTarget(el.current, parent.current);
        }
      }
      scrollDown.call(_this);
      // scroll down after images load again
      setTimeout(scrollDown.bind(_this), 200);
    };
    /**
     * target - target to scroll to (DOM element, scrollTop Number, 'top', or 'bottom'
     * containerEl - DOM element for the container with scrollbars
     * source: https://stackoverflow.com/a/48429314
     */
    _this.scrollToTarget = function(target, containerEl) {
      // Moved up here for readability:
      var isElement = target && target.nodeType === 1,
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
    _this.setEditingState = function(message) {
      _this.setState({
        editing: message.id,
      });
    };
    _this.clearEditingState = function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      _this.setState({
        editing: '',
      });
    };
    _this.insertDates = function(messages) {
      var newMessages = [];
      for (var _i = 0, _a = messages.entries(); _i < _a.length; _i++) {
        var _b = _a[_i],
          i = _b[0],
          message = _b[1];
        if (message.type === 'message.read') {
          newMessages.push(message);
          continue;
        }
        var messageDate = message.created_at.getDay();
        var prevMessageDate = messageDate;
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
        var eventsNextToMessage =
          _this.props.eventHistory[message.id || 'first'];
        if (eventsNextToMessage && eventsNextToMessage.length > 0) {
          eventsNextToMessage.forEach(function(e) {
            newMessages.push({
              type: 'channel.event',
              event: e,
            });
          });
        }
      }
      return newMessages;
    };
    _this.insertIntro = function(messages) {
      var newMessages = messages || [];
      // if no headerPosition is set, HeaderComponent will go at the top
      if (!_this.props.headerPosition) {
        newMessages.unshift({
          type: 'channel.intro',
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
      for (var _i = 0, _a = messages.entries(); _i < _a.length; _i++) {
        var _b = _a[_i],
          i = _b[0],
          message = _b[1];
        var messageTime = message.created_at
          ? message.created_at.getTime()
          : null;
        var nextMessageTime =
          messages[i + 1] && messages[i + 1].created_at
            ? messages[i + 1].created_at.getTime()
            : null;
        var headerPosition = _this.props.headerPosition;
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
    _this.goToNewMessages = function() {
      return __awaiter(_this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.scrollToBottom()];
            case 1:
              _a.sent();
              this.setState({
                newMessagesNotification: false,
              });
              return [2 /*return*/];
          }
        });
      });
    };
    _this.getReadStates = function(messages) {
      // create object with empty array for each message id
      var readData = {};
      for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        readData[message.id] = [];
      }
      for (
        var _a = 0, _b = Object.values(_this.props.read);
        _a < _b.length;
        _a++
      ) {
        var readState = _b[_a];
        if (readState.last_read == null) {
          break;
        }
        var userLastReadMsgId = void 0;
        for (var _c = 0, messages_2 = messages; _c < messages_2.length; _c++) {
          var msg = messages_2[_c];
          if (msg.updated_at < readState.last_read) {
            userLastReadMsgId = msg.id;
          }
        }
        if (userLastReadMsgId != null) {
          readData[userLastReadMsgId] = __spreadArrays(
            readData[userLastReadMsgId],
            [readState.user],
          );
        }
      }
      return readData;
    };
    _this.userScrolledUp = function() {
      return _this.scrollOffset > 310;
    };
    _this.listenToScroll = function(offset) {
      _this.scrollOffset = offset;
      if (_this.state.newMessagesNotification && !_this.userScrolledUp()) {
        _this.setState({
          newMessagesNotification: false,
        });
      }
    };
    _this.getLastReceived = function(messages) {
      var l = messages.length;
      var lastReceivedId = null;
      for (var i = l; i > 0; i--) {
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
    _this.getGroupStyles = function(m) {
      var l = m.length;
      var messageGroupStyles = {};
      var messages = __spreadArrays(m);
      for (var i = 0; i < l; i++) {
        var previousMessage = messages[i - 1];
        var message = messages[i];
        var nextMessage = messages[i + 1];
        var groupStyles = [];
        if (message.type === 'message.date') {
          continue;
        }
        if (message.type === 'channel.event') {
          continue;
        }
        if (message.type === 'channel.intro') {
          continue;
        }
        var userId = message.user.id;
        var isTopMessage =
          !previousMessage ||
          previousMessage.type === 'channel.intro' ||
          previousMessage.type === 'message.date' ||
          previousMessage.type === 'system' ||
          previousMessage.type === 'channel.event' ||
          previousMessage.attachments.length !== 0 ||
          userId !== previousMessage.user.id ||
          previousMessage.type === 'error' ||
          previousMessage.deleted_at;
        var isBottomMessage =
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
        if (_this.props.noGroupByUser) {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('single');
        }
        messageGroupStyles[message.id] = groupStyles;
      }
      return messageGroupStyles;
    };
    _this._onMentionsHoverOrClick = function(e, mentioned_users) {
      if (!_this.props.onMentionsHover || !_this.props.onMentionsClick) return;
      var tagName = e.target.tagName.toLowerCase();
      var textContent = e.target.innerHTML.replace('*', '');
      if (tagName === 'strong' && textContent[0] === '@') {
        var userName_1 = textContent.replace('@', '');
        var user = mentioned_users.find(function(user) {
          return user.name === userName_1 || user.id === userName_1;
        });
        if (_this.props.onMentionsHover && e.type === 'mouseover') {
          _this.props.onMentionsHover(e, user);
        }
        if (_this.props.onMentionsClick && e.type === 'click') {
          _this.props.onMentionsHover(e, user);
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
    _this.addNotification = function(notificationText, type) {
      if (typeof notificationText !== 'string') return;
      if (type !== 'success' && type !== 'error') return;
      var nextIndex = new Date();
      var newNotifications = __spreadArrays(_this.state.notifications);
      newNotifications.push({
        id: nextIndex,
        text: notificationText,
        type: type,
      });
      _this.setState({
        notifications: newNotifications,
      });
      // remove the notification after 5000 ms
      var ct = setTimeout(function() {
        var index = _this.state.notifications.findIndex(function(notification) {
          if (notification.id === nextIndex) return true;
          return false;
        });
        var newNotifications = __spreadArrays(_this.state.notifications);
        newNotifications.splice(index, 1);
        _this.setState({
          notifications: newNotifications,
        });
      }, 5000);
      _this.notificationTimeouts.push(ct);
    };
    _this._loadMore = function() {
      return _this.props.messageLimit
        ? _this.props.loadMore(_this.props.messageLimit)
        : _this.props.loadMore();
    };
    _this.state = {
      newMessagesNotification: false,
      editing: '',
      online: true,
      notifications: [],
    };
    _this.bottomRef = react_1.default.createRef();
    _this.messageList = react_1.default.createRef();
    _this.messageRefs = {};
    _this.notificationTimeouts = [];
    return _this;
  }
  MessageList.prototype.componentDidMount = function() {
    // start at the bottom
    this.scrollToBottom();
    var messageListRect = this.messageList.current.getBoundingClientRect();
    this.setState({
      messageListRect: messageListRect,
    });
    this.props.client.on('connection.changed', this.connectionChanged);
    document.addEventListener('keydown', this.keypress);
  };
  MessageList.prototype.componentWillUnmount = function() {
    this.props.client.off('connection.changed', this.connectionChanged);
    document.removeEventListener('keydown', this.keypress);
    this.notificationTimeouts.forEach(function(ct) {
      clearTimeout(ct);
    });
  };
  MessageList.prototype.getSnapshotBeforeUpdate = function(prevProps) {
    if (this.props.threadList) {
      return null;
    }
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    if (
      prevProps.messages.length < this.props.messages.length ||
      !deep_equal_1.default(this.props.eventHistory, prevProps.eventHistory)
    ) {
      var list = this.messageList.current;
      return {
        offsetTop: list.scrollTop,
        offsetBottom: list.scrollHeight - list.scrollTop,
      };
    }
    return null;
  };
  MessageList.prototype.componentDidUpdate = function(
    prevProps,
    prevState,
    snapshot,
  ) {
    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    var userScrolledUp = this.userScrolledUp();
    var currentLastMessage = this.props.messages[
      this.props.messages.length - 1
    ];
    var previousLastMessage = prevProps.messages[prevProps.messages.length - 1];
    if (!previousLastMessage || !currentLastMessage) {
      return;
    }
    var hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
    var isOwner = currentLastMessage.user.id === this.props.client.userID;
    var list = this.messageList.current;
    // always scroll down when it's your own message that you added...
    var scrollToBottom = hasNewMessage && (isOwner || !userScrolledUp);
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
  };
  // eslint-disable-next-line
  MessageList.prototype.render = function() {
    var _this = this;
    var allMessages = __spreadArrays(this.props.messages);
    var MessageSystem = this.props.MessageSystem;
    allMessages = this.insertDates(allMessages);
    if (this.props.HeaderComponent) {
      allMessages = this.insertIntro(allMessages);
    }
    var messageGroupStyles = this.getGroupStyles(allMessages);
    var _a = this.props,
      TypingIndicator = _a.TypingIndicator,
      DateSeparator = _a.dateSeparator,
      HeaderComponent = _a.HeaderComponent,
      EmptyStateIndicator = _a.EmptyStateIndicator,
      t = _a.t;
    // sort by date
    allMessages.sort(function(a, b) {
      return a.created_at - b.created_at;
    });
    // get the readData
    var readData = this.getReadStates(allMessages);
    var lastReceivedId = this.getLastReceived(allMessages);
    var elements = [];
    // loop over the messages
    for (
      var _i = 0, allMessages_1 = allMessages;
      _i < allMessages_1.length;
      _i++
    ) {
      var message = allMessages_1[_i];
      if (message.id) {
        this.messageRefs[message.id] = react_1.default.createRef();
      }
      if (message.type === 'message.date') {
        if (this.props.threadList) {
          continue;
        }
        elements.push(
          react_1.default.createElement(
            'li',
            { key: message.date.toISOString() + '-i' },
            react_1.default.createElement(DateSeparator, {
              date: message.date,
            }),
          ),
        );
      } else if (message.type === 'channel.intro') {
        elements.push(
          react_1.default.createElement(
            'li',
            { key: 'intro' },
            react_1.default.createElement(HeaderComponent, null),
          ),
        );
      } else if (
        message.type === 'channel.event' ||
        message.type === 'system'
      ) {
        MessageSystem &&
          elements.push(
            react_1.default.createElement(
              'li',
              {
                key:
                  message.type === 'system'
                    ? message.created_at
                    : message.type === 'channel.event'
                    ? message.event.created_at
                    : '',
              },
              react_1.default.createElement(MessageSystem, {
                message: message,
              }),
            ),
          );
      } else if (message.type !== 'message.read') {
        var groupStyles = messageGroupStyles[message.id];
        if (!groupStyles) {
          groupStyles = [];
        }
        var readBy = readData[message.id] || [];
        elements.push(
          react_1.default.createElement(
            'li',
            {
              className: 'str-chat__li str-chat__li--' + groupStyles,
              key: message.id || message.created_at,
              ref: this.messageRefs[message.id],
            },
            react_1.default.createElement(Message_1.Message, {
              client: this.props.client,
              openThread: this.props.openThread,
              members: this.props.members,
              watchers: this.props.watchers,
              message: message,
              groupStyles: groupStyles,
              readBy: readBy,
              lastReceivedId:
                lastReceivedId === message.id ? lastReceivedId : null,
              editing: !!(
                this.state.editing && this.state.editing === message.id
              ),
              clearEditingState: this.clearEditingState,
              setEditingState: this.setEditingState,
              messageListRect: this.state.messageListRect,
              channel: this.props.channel,
              threadList: this.props.threadList,
              retrySendMessage: this.props.retrySendMessage,
              addNotification: this.addNotification,
              updateMessage: this.props.updateMessage,
              removeMessage: this.props.removeMessage,
              Message: this.props.Message,
              unsafeHTML: this.props.unsafeHTML,
              Attachment: this.props.Attachment,
              onMentionsClick: this.props.onMentionsClick,
              onMentionsHover: this.props.onMentionsHover,
              messageActions: this.props.messageActions,
              additionalMessageInputProps: this.props
                .additionalMessageInputProps,
              getFlagMessageSuccessNotification: this.props
                .getFlagMessageSuccessNotification,
              getFlagMessageErrorNotification: this.props
                .getFlagMessageErrorNotification,
              getMuteUserSuccessNotification: this.props
                .getMuteUserSuccessNotification,
              getMuteUserErrorNotification: this.props
                .getMuteUserErrorNotification,
            }),
          ),
        );
      }
    }
    return react_1.default.createElement(
      react_1.default.Fragment,
      null,
      react_1.default.createElement(
        'div',
        {
          className:
            'str-chat__list ' +
            (this.props.threadList ? 'str-chat__list--thread' : ''),
          ref: this.messageList,
        },
        !elements.length
          ? react_1.default.createElement(EmptyStateIndicator, {
              listType: 'message',
            })
          : react_1.default.createElement(
              ReverseInfiniteScroll_1.ReverseInfiniteScroll,
              {
                loadMore: this._loadMore,
                hasMore: this.props.hasMore,
                isLoading: this.props.loadingMore,
                listenToScroll: this.listenToScroll,
                useWindow: false,
                loader: react_1.default.createElement(
                  Center,
                  { key: 'loadingindicator' },
                  react_1.default.createElement(
                    LoadingIndicator_1.LoadingIndicator,
                    { size: 20 },
                  ),
                ),
              },
              react_1.default.createElement(
                'ul',
                { className: 'str-chat__ul' },
                elements,
              ),
              this.props.TypingIndicator &&
                react_1.default.createElement(TypingIndicator, {
                  typing: this.props.typing,
                  client: this.props.client,
                }),
              react_1.default.createElement('div', {
                key: 'bottom',
                ref: this.bottomRef,
              }),
            ),
      ),
      react_1.default.createElement(
        'div',
        { className: 'str-chat__list-notifications' },
        this.state.notifications.map(function(notification) {
          return react_1.default.createElement(
            Notification,
            { active: true, key: notification.id, type: notification.type },
            notification.text,
          );
        }),
        react_1.default.createElement(
          Notification,
          { active: !this.state.online, type: 'error' },
          t('Connection failure, reconnecting now...'),
        ),
        react_1.default.createElement(
          MessageNotification_1.MessageNotification,
          {
            showNotification: this.state.newMessagesNotification,
            onClick: function() {
              return _this.goToNewMessages();
            },
          },
          t('New Messages!'),
        ),
      ),
    );
  };
  MessageList.propTypes = {
    /**
     * Typing indicator UI component to render
     *
     * Defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator.js)
     * */
    TypingIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Date separator UI component to render
     *
     * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.js)
     * */
    dateSeparator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /** Turn off grouping of messages by user */
    noGroupByUser: prop_types_1.default.bool,
    /** render HTML instead of markdown. Posting HTML is only allowed server-side */
    unsafeHTML: prop_types_1.default.bool,
    /** Set the limit to use when paginating messages */
    messageLimit: prop_types_1.default.number,
    /**
     * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
     * If all the actions need to be disabled, empty array or false should be provided as value of prop.
     * */
    messageActions: prop_types_1.default.oneOfType([
      prop_types_1.default.bool,
      prop_types_1.default.array,
    ]),
    /**
     * Boolean weather current message list is a thread.
     */
    threadList: prop_types_1.default.bool,
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageSuccessNotification: prop_types_1.default.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageErrorNotification: prop_types_1.default.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserSuccessNotification: prop_types_1.default.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserErrorNotification: prop_types_1.default.func,
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    client: prop_types_1.default.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    Attachment: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    Message: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Custom UI component to display system messages.
     *
     * Defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.js)
     */
    MessageSystem: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * The UI Indicator to use when MessagerList or ChannelList is empty
     * */
    EmptyStateIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Component to render at the top of the MessageList
     * */
    HeaderComponent: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    messages: prop_types_1.default.array.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    channel: prop_types_1.default.object.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    updateMessage: prop_types_1.default.func.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    retrySendMessage: prop_types_1.default.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    removeMessage: prop_types_1.default.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    onMentionsClick: prop_types_1.default.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    onMentionsHover: prop_types_1.default.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    openThread: prop_types_1.default.func,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    members: prop_types_1.default.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    watchers: prop_types_1.default.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    read: prop_types_1.default.object,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    typing: prop_types_1.default.object,
    /**
     * Additional props for underlying MessageInput component. We have instance of MessageInput
     * component in MessageSimple component, for handling edit state.
     * Available props - https://getstream.github.io/stream-chat-react/#messageinput
     * */
    additionalMessageInputProps: prop_types_1.default.object,
  };
  MessageList.defaultProps = {
    Message: MessageSimple_1.MessageSimple,
    MessageSystem: EventComponent_1.EventComponent,
    threadList: false,
    Attachment: Attachment_1.Attachment,
    dateSeparator: DateSeparator_1.DateSeparator,
    EmptyStateIndicator: EmptyStateIndicator_1.EmptyStateIndicator,
    unsafeHTML: false,
    noGroupByUser: false,
    messageActions: Object.keys(utils_1.MESSAGE_ACTIONS),
  };
  return MessageList;
})(react_1.PureComponent);
exports.MessageList = MessageList;
exports.MessageList = MessageList = context_1.withChannelContext(
  context_1.withTranslationContext(MessageList),
);
var Center = function(_a) {
  var children = _a.children;
  return react_1.default.createElement(
    'div',
    { className: 'str-chat__list__center' },
    children,
  );
};
var Notification = function(_a) {
  var children = _a.children,
    active = _a.active,
    type = _a.type;
  if (active) {
    return react_1.default.createElement(
      'div',
      { className: 'str-chat__custom-notification notification-' + type },
      children,
    );
  }
  return null;
};
