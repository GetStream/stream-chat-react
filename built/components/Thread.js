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
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var context_1 = require('../context');
var MessageList_1 = require('./MessageList');
var MessageInput_1 = require('./MessageInput');
var prop_types_1 = __importDefault(require('prop-types'));
var Message_1 = require('./Message');
var MessageInputSmall_1 = require('./MessageInputSmall');
var utils_1 = require('../utils');
/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ./docs/Thread.md
 * @extends Component
 */
var Thread = /** @class */ (function(_super) {
  __extends(Thread, _super);
  function Thread() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  Thread.prototype.render = function() {
    if (!this.props.thread) {
      return null;
    }
    var parentID = this.props.thread.id;
    var cid = this.props.channel.cid;
    var key = 'thread-' + parentID + '-' + cid;
    // We use a wrapper to make sure the key variable is set.
    // this ensures that if you switch thread the component is recreated
    return react_1.default.createElement(
      ThreadInner,
      __assign({}, this.props, { key: key }),
    );
  };
  Thread.propTypes = {
    /** Display the thread on 100% width of it's container. Useful for mobile style view */
    fullWidth: prop_types_1.default.bool,
    /** Make input focus on mounting thread */
    autoFocus: prop_types_1.default.bool,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    channel: prop_types_1.default.object.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
    Message: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
     * The thread (the parent [message object](https://getstream.io/chat/docs/#message_format)) */
    thread: prop_types_1.default.oneOfType([
      prop_types_1.default.object,
      prop_types_1.default.bool,
    ]),
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
     * The array of immutable messages to render. By default they are provided by parent Channel component */
    threadMessages: prop_types_1.default.array.isRequired,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
     *
     * Function which provides next page of thread messages.
     * loadMoreThread is called when infinite scroll wants to load more messages
     * */
    loadMoreThread: prop_types_1.default.func.isRequired,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
     * If there are more messages available, set to false when the end of pagination is reached.
     * */
    threadHasMore: prop_types_1.default.bool,
    /**
     * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
     * If the thread is currently loading more messages. This is helpful to display a loading indicator on threadlist */
    threadLoadingMore: prop_types_1.default.bool,
    /**
     * Additional props for underlying Message component of parent message at the top.
     * Available props - https://getstream.github.io/stream-chat-react/#message
     * */
    additionalParentMessageProps: prop_types_1.default.object,
    /**
     * Additional props for underlying MessageList component.
     * Available props - https://getstream.github.io/stream-chat-react/#messagelist
     * */
    additionalMessageListProps: prop_types_1.default.object,
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.github.io/stream-chat-react/#messageinput
     * */
    additionalMessageInputProps: prop_types_1.default.object,
    /** Customized MessageInput component to used within Thread instead of default MessageInput
            Useable as follows:
            ```
            <Thread MessageInput={(props) => <MessageInput parent={props.parent} Input={MessageInputSmall} /> }/>
            ```
        */
    MessageInput: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
  };
  Thread.defaultProps = {
    threadHasMore: true,
    threadLoadingMore: true,
    fullWidth: false,
    autoFocus: true,
    MessageInput: MessageInput_1.MessageInput,
  };
  return Thread;
})(react_1.default.PureComponent);
exports.Thread = Thread;
var ThreadInner = /** @class */ (function(_super) {
  __extends(ThreadInner, _super);
  function ThreadInner(props) {
    var _this = _super.call(this, props) || this;
    _this.messageList = react_1.default.createRef();
    return _this;
  }
  ThreadInner.prototype.componentDidMount = function() {
    return __awaiter(this, void 0, void 0, function() {
      var parentID;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            parentID = this.props.thread.id;
            if (!(parentID && this.props.thread.reply_count))
              return [3 /*break*/, 2];
            return [4 /*yield*/, this.props.loadMoreThread()];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            return [2 /*return*/];
        }
      });
    });
  };
  ThreadInner.prototype.getSnapshotBeforeUpdate = function(prevProps) {
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    if (prevProps.threadMessages.length < this.props.threadMessages.length) {
      var list = this.messageList.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  };
  ThreadInner.prototype.componentDidUpdate = function(
    prevProps,
    prevState,
    snapshot,
  ) {
    return __awaiter(this, void 0, void 0, function() {
      var parentID, list_1, scrollDown;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            parentID = this.props.thread.id;
            if (
              !(
                parentID &&
                this.props.thread.reply_count > 0 &&
                this.props.threadMessages.length === 0
              )
            )
              return [3 /*break*/, 2];
            return [4 /*yield*/, this.props.loadMoreThread()];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            // If we have a snapshot value, we've just added new items.
            // Adjust scroll so these new items don't push the old ones out of view.
            // (snapshot here is the value returned from getSnapshotBeforeUpdate)
            if (snapshot !== null) {
              list_1 = this.messageList.current;
              scrollDown = function() {
                list_1.scrollTop = list_1.scrollHeight - snapshot;
              };
              scrollDown();
              // scroll down after images load again
              setTimeout(scrollDown, 100);
            }
            return [2 /*return*/];
        }
      });
    });
  };
  ThreadInner.prototype.render = function() {
    var _this = this;
    if (!this.props.thread) {
      return null;
    }
    var t = this.props.t;
    var read = {};
    return react_1.default.createElement(
      'div',
      {
        className:
          'str-chat__thread ' +
          (this.props.fullWidth ? 'str-chat__thread--full' : ''),
      },
      react_1.default.createElement(
        'div',
        { className: 'str-chat__thread-header' },
        react_1.default.createElement(
          'div',
          { className: 'str-chat__thread-header-details' },
          react_1.default.createElement('strong', null, t('Thread')),
          react_1.default.createElement(
            'small',
            null,
            ' ',
            t('{{ replyCount }} replies', {
              replyCount: this.props.thread.reply_count,
            }),
          ),
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: function(e) {
              return _this.props.closeThread(e);
            },
            className: 'str-chat__square-button',
          },
          react_1.default.createElement(
            'svg',
            { width: '10', height: '10', xmlns: 'http://www.w3.org/2000/svg' },
            react_1.default.createElement('path', {
              d:
                'M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z',
              fillRule: 'evenodd',
            }),
          ),
        ),
      ),
      react_1.default.createElement(
        'div',
        { className: 'str-chat__thread-list', ref: this.messageList },
        react_1.default.createElement(
          Message_1.Message,
          __assign(
            {
              message: this.props.thread,
              initialMessage: true,
              threadList: true,
              Message: this.props.Message,
            },
            this.props,
            this.props.additionalParentMessageProps,
          ),
        ),
        react_1.default.createElement(
          'div',
          { className: 'str-chat__thread-start' },
          t('Start of a new thread'),
        ),
        react_1.default.createElement(
          MessageList_1.MessageList,
          __assign(
            {
              messages: this.props.threadMessages,
              read: read,
              threadList: true,
              loadMore: this.props.loadMoreThread,
              hasMore: this.props.threadHasMore,
              loadingMore: this.props.threadLoadingMore,
              Message: this.props.Message,
            },
            this.props.additionalMessageListProps,
          ),
        ),
        utils_1.smartRender(
          this.props.MessageInput,
          __assign(
            {
              MessageInputSmall: MessageInputSmall_1.MessageInputSmall,
              parent: this.props.thread,
              focus: this.props.autoFocus,
            },
            this.props.additionalMessageInputProps,
          ),
        ),
      ),
    );
  };
  ThreadInner.propTypes = {
    /** Channel is passed via the Channel Context */
    channel: prop_types_1.default.object.isRequired,
    /** the thread (just a message) that we're rendering */
    thread: prop_types_1.default.object.isRequired,
  };
  return ThreadInner;
})(react_1.default.PureComponent);
exports.Thread = Thread = context_1.withChannelContext(
  context_1.withTranslationContext(Thread),
);
