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
var prop_types_1 = __importDefault(require('prop-types'));
var context_1 = require('../context');
var Streami18n_1 = require('../Streami18n');
/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ./docs/Chat.md
 * @extends PureComponent
 */
var Chat = /** @class */ (function(_super) {
  __extends(Chat, _super);
  function Chat(props) {
    var _this = _super.call(this, props) || this;
    _this.setActiveChannel = function(channel, watchers, e) {
      if (watchers === void 0) {
        watchers = {};
      }
      return __awaiter(_this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (e !== undefined && e.preventDefault) {
                e.preventDefault();
              }
              if (!Object.keys(watchers).length) return [3 /*break*/, 2];
              return [
                4 /*yield*/,
                channel.query({ watch: true, watchers: watchers }),
              ];
            case 1:
              _a.sent();
              _a.label = 2;
            case 2:
              this.setState(function() {
                return {
                  channel: channel,
                };
              });
              if (this.state.navOpen) {
                this.closeMobileNav();
              }
              return [2 /*return*/];
          }
        });
      });
    };
    _this.openMobileNav = function() {
      setTimeout(function() {
        _this.setState({
          navOpen: true,
        });
      }, 100);
    };
    _this.closeMobileNav = function() {
      _this.setState({
        navOpen: false,
      });
    };
    _this.getContext = function() {
      return {
        client: _this.props.client,
        channel: _this.state.channel,
        setActiveChannel: _this.setActiveChannel,
        openMobileNav: _this.openMobileNav,
        closeMobileNav: _this.closeMobileNav,
        navOpen: _this.state.navOpen,
        theme: _this.props.theme,
      };
    };
    _this.state = {
      // currently active channel
      channel: {},
      navOpen: true,
      error: false,
    };
    return _this;
  }
  Chat.prototype.componentDidMount = function() {
    return __awaiter(this, void 0, void 0, function() {
      var i18nInstance, streami18n, _a, t, tDateTimeParser;
      var _this = this;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            i18nInstance = this.props.i18nInstance;
            if (
              i18nInstance &&
              i18nInstance instanceof Streami18n_1.Streami18n
            ) {
              streami18n = i18nInstance;
            } else {
              streami18n = new Streami18n_1.Streami18n({ language: 'en' });
            }
            streami18n.registerSetLanguageCallback(function(t) {
              _this.setState({ t: t });
            });
            return [4 /*yield*/, streami18n.getTranslators()];
          case 1:
            (_a = _b.sent()),
              (t = _a.t),
              (tDateTimeParser = _a.tDateTimeParser);
            this.setState({ t: t, tDateTimeParser: tDateTimeParser });
            return [2 /*return*/];
        }
      });
    });
  };
  Chat.prototype.render = function() {
    if (!this.state.t) return null;
    return react_1.default.createElement(
      context_1.ChatContext.Provider,
      { value: this.getContext() },
      react_1.default.createElement(
        context_1.TranslationContext.Provider,
        {
          value: {
            t: this.state.t,
            tDateTimeParser: this.state.tDateTimeParser,
          },
        },
        this.props.children,
      ),
    );
  };
  Chat.propTypes = {
    /** The StreamChat client object */
    client: prop_types_1.default.object.isRequired,
    /**
     *
     * Theme could be used for custom styling of the components.
     *
     * You can override the classes used in our components under parent theme class.
     *
     * e.g. If you want to build a theme where background of message is black
     *
     * ```
     *  <Chat client={client} theme={demo}>
     *    <Channel>
     *      <MessageList />
     *    </Channel>
     *  </Chat>
     * ```
     *
     * ```scss
     *  .demo.str-chat {
     *    .str-chat__message-simple {
     *      &-text-inner {
     *        background-color: black;
     *      }
     *    }
     *  }
     * ```
     *
     * Built in available themes:
     *
     *  - `messaging light`
     *  - `messaging dark`
     *  - `team light`
     *  - `team dark`
     *  - `commerce light`
     *  - `commerce dark`
     *  - `livestream light`
     *  - `livestream dark`
     */
    theme: prop_types_1.default.string,
  };
  Chat.defaultProps = {
    theme: 'messaging light',
  };
  return Chat;
})(react_1.PureComponent);
exports.Chat = Chat;
