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
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var utils_1 = require('../utils');
var context_1 = require('../context');
/**
 * MessageActionsBox - A component for taking action on a message
 *
 * @example ./docs/MessageActionsBox.md
 * @extends PureComponent
 */
var MessageActionsBox = /** @class */ (function(_super) {
  __extends(MessageActionsBox, _super);
  function MessageActionsBox() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.actionsBoxRef = react_1.default.createRef();
    _this.state = {
      reverse: false,
      rect: null,
    };
    return _this;
  }
  MessageActionsBox.prototype.componentDidMount = function() {};
  MessageActionsBox.prototype.componentDidUpdate = function(prevProps) {
    return __awaiter(this, void 0, void 0, function() {
      var ml;
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            if (!(!prevProps.open && this.props.open)) return [3 /*break*/, 3];
            if (!(this.state.rect === null)) return [3 /*break*/, 2];
            return [
              4 /*yield*/,
              this.setState({
                rect: this.actionsBoxRef.current.getBoundingClientRect(),
              }),
            ];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            ml = this.props.messageListRect;
            if (this.props.mine) {
              this.setState({
                reverse: this.state.rect.left < ml.left ? true : false,
              });
            } else if (!this.props.mine) {
              this.setState({
                reverse: this.state.rect.right + 5 > ml.right ? true : false,
              });
            }
            _a.label = 3;
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  MessageActionsBox.prototype.render = function() {
    var _a = this.props,
      handleFlag = _a.handleFlag,
      handleMute = _a.handleMute,
      handleEdit = _a.handleEdit,
      handleDelete = _a.handleDelete,
      getMessageActions = _a.getMessageActions,
      t = _a.t;
    var messageActions = getMessageActions();
    return react_1.default.createElement(
      'div',
      {
        className:
          'str-chat__message-actions-box\n          ' +
          (this.props.open ? 'str-chat__message-actions-box--open' : '') +
          '\n          ' +
          (this.props.mine ? 'str-chat__message-actions-box--mine' : '') +
          '\n          ' +
          (this.state.reverse ? 'str-chat__message-actions-box--reverse' : '') +
          '\n        ',
        ref: this.actionsBoxRef,
      },
      react_1.default.createElement(
        'ul',
        { className: 'str-chat__message-actions-list' },
        messageActions.indexOf(utils_1.MESSAGE_ACTIONS.flag) > -1 &&
          react_1.default.createElement(
            'button',
            { onClick: handleFlag },
            react_1.default.createElement(
              'li',
              { className: 'str-chat__message-actions-list-item' },
              t('Flag'),
            ),
          ),
        messageActions.indexOf(utils_1.MESSAGE_ACTIONS.mute) > -1 &&
          react_1.default.createElement(
            'button',
            { onClick: handleMute },
            react_1.default.createElement(
              'li',
              { className: 'str-chat__message-actions-list-item' },
              t('Mute'),
            ),
          ),
        messageActions.indexOf(utils_1.MESSAGE_ACTIONS.edit) > -1 &&
          react_1.default.createElement(
            'button',
            { onClick: handleEdit },
            react_1.default.createElement(
              'li',
              { className: 'str-chat__message-actions-list-item' },
              t('Edit Message'),
            ),
          ),
        messageActions.indexOf(utils_1.MESSAGE_ACTIONS.delete) > -1 &&
          react_1.default.createElement(
            'button',
            { onClick: handleDelete },
            react_1.default.createElement(
              'li',
              { className: 'str-chat__message-actions-list-item' },
              t('Delete'),
            ),
          ),
      ),
    );
  };
  MessageActionsBox.propTypes = {
    /** If the message actions box should be open or not */
    open: prop_types_1.default.bool.isRequired,
    /**
     * @deprecated
     *
     *  The message component, most logic is delegated to this component and MessageActionsBox uses the following functions explicitly:
     *  `handleFlag`, `handleMute`, `handleEdit`, `handleDelete`, `canDeleteMessage`, `canEditMessage`, `isMyMessage`, `isAdmin`
     */
    Message: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
      prop_types_1.default.object,
    ]).isRequired,
    /** If message belongs to current user. */
    mine: prop_types_1.default.bool,
    /** DOMRect object for parent MessageList component */
    messageListRect: prop_types_1.default.object,
    /**
     * Handler for flaging a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleFlag: prop_types_1.default.func,
    /**
     * Handler for muting a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleMute: prop_types_1.default.func,
    /**
     * Handler for editing a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleEdit: prop_types_1.default.func,
    /**
     * Handler for deleting a current message
     *
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    handleDelete: prop_types_1.default.func,
    /**
     * Returns array of avalable message actions for current message.
     * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
     */
    getMessageActions: prop_types_1.default.func,
  };
  MessageActionsBox.defaultProps = {
    open: false,
  };
  return MessageActionsBox;
})(react_1.default.Component);
exports.MessageActionsBox = MessageActionsBox;
exports.MessageActionsBox = MessageActionsBox = context_1.withTranslationContext(
  MessageActionsBox,
);
