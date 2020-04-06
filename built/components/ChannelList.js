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
var prop_types_1 = __importDefault(require('prop-types'));
var seamless_immutable_1 = __importDefault(require('seamless-immutable'));
var utils_1 = require('../utils');
var ChannelPreviewLastMessage_1 = require('./ChannelPreviewLastMessage');
var ChannelPreview_1 = require('./ChannelPreview');
var EmptyStateIndicator_1 = require('./EmptyStateIndicator');
var LoadingChannels_1 = require('./LoadingChannels');
var LoadMorePaginator_1 = require('./LoadMorePaginator');
var context_1 = require('../context');
var ChannelListTeam_1 = require('./ChannelListTeam');
var utils_2 = require('../utils');
var lodash_uniqby_1 = __importDefault(require('lodash.uniqby'));
var deep_equal_1 = __importDefault(require('deep-equal'));
var ChatDown_1 = require('./ChatDown');
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */
var ChannelList = /** @class */ (function(_super) {
  __extends(ChannelList, _super);
  function ChannelList(props) {
    var _this = _super.call(this, props) || this;
    _this.queryChannels = function() {
      return __awaiter(_this, void 0, void 0, function() {
        var _a,
          options,
          filters,
          sort,
          setActiveChannelOnMount,
          offset,
          newOptions,
          channelPromise,
          channelQueryResponse_1,
          customActiveChannel,
          e_1;
        var _this = this;
        return __generator(this, function(_b) {
          switch (_b.label) {
            case 0:
              (_a = this.props),
                (options = _a.options),
                (filters = _a.filters),
                (sort = _a.sort),
                (setActiveChannelOnMount = _a.setActiveChannelOnMount);
              offset = this.state.offset;
              this.setState({ refreshing: true });
              newOptions = __assign({}, options);
              if (!options.limit) newOptions.limit = 30;
              channelPromise = this.props.client.queryChannels(
                filters,
                sort,
                __assign(__assign({}, newOptions), { offset: offset }),
              );
              _b.label = 1;
            case 1:
              _b.trys.push([1, 4, , 5]);
              channelQueryResponse_1 = channelPromise;
              if (!utils_1.isPromise(channelQueryResponse_1))
                return [3 /*break*/, 3];
              return [4 /*yield*/, channelPromise];
            case 2:
              channelQueryResponse_1 = _b.sent();
              _b.label = 3;
            case 3:
              this.setState(function(prevState) {
                var channels = __spreadArrays(
                  prevState.channels,
                  channelQueryResponse_1,
                );
                return {
                  channels: channels,
                  loadingChannels: false,
                  offset: channels.length,
                  hasNextPage:
                    channelQueryResponse_1.length >= newOptions.limit
                      ? true
                      : false,
                  refreshing: false,
                };
              });
              // Set a channel as active and move it to the top of the list.
              if (this.props.customActiveChannel) {
                customActiveChannel = channelQueryResponse_1.filter(function(
                  channel,
                ) {
                  return channel.id === _this.props.customActiveChannel;
                })[0];
                if (customActiveChannel) {
                  this.props.setActiveChannel(
                    customActiveChannel,
                    this.props.watchers,
                  );
                  this.moveChannelUp(customActiveChannel.cid);
                }
              } else if (
                setActiveChannelOnMount &&
                offset === 0 &&
                this.state.channels.length
              ) {
                this.props.setActiveChannel(
                  this.state.channels[0],
                  this.props.watchers,
                );
              }
              return [3 /*break*/, 5];
            case 4:
              e_1 = _b.sent();
              console.warn(e_1);
              this.setState({ error: true, refreshing: false });
              return [3 /*break*/, 5];
            case 5:
              return [2 /*return*/];
          }
        });
      });
    };
    // eslint-disable-next-line sonarjs/cognitive-complexity
    _this.handleEvent = function(e) {
      return __awaiter(_this, void 0, void 0, function() {
        var newChannels,
          channel_1,
          channel_2,
          channels,
          channelIndex,
          channels,
          channelIndex;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              if (e.type === 'user.presence.changed') {
                newChannels = this.state.channels;
                newChannels = newChannels.map(function(channel) {
                  if (!channel.state.members[e.user.id]) return channel;
                  channel.state.members.setIn([e.user.id, 'user'], e.user);
                  return channel;
                });
                this.setState({ channels: __spreadArrays(newChannels) });
              }
              if (e.type === 'message.new') {
                !this.props.lockChannelOrder && this.moveChannelUp(e.cid);
              }
              // make sure to re-render the channel list after connection is recovered
              if (e.type === 'connection.recovered') {
                this.setState(function(prevState) {
                  return {
                    connectionRecoveredCount:
                      prevState.connectionRecoveredCount + 1,
                  };
                });
              }
              if (!(e.type === 'notification.message_new'))
                return [3 /*break*/, 3];
              if (
                !(
                  this.props.onMessageNew &&
                  typeof this.props.onMessageNew === 'function'
                )
              )
                return [3 /*break*/, 1];
              this.props.onMessageNew(this, e);
              return [3 /*break*/, 3];
            case 1:
              return [
                4 /*yield*/,
                this.getChannel(e.channel.type, e.channel.id),
              ];
            case 2:
              channel_1 = _a.sent();
              // move channel to starting position
              this.setState(function(prevState) {
                return {
                  channels: lodash_uniqby_1.default(
                    __spreadArrays([channel_1], prevState.channels),
                    'cid',
                  ),
                };
              });
              _a.label = 3;
            case 3:
              if (!(e.type === 'notification.added_to_channel'))
                return [3 /*break*/, 6];
              if (
                !(
                  this.props.onAddedToChannel &&
                  typeof this.props.onAddedToChannel === 'function'
                )
              )
                return [3 /*break*/, 4];
              this.props.onAddedToChannel(this, e);
              return [3 /*break*/, 6];
            case 4:
              return [
                4 /*yield*/,
                this.getChannel(e.channel.type, e.channel.id),
              ];
            case 5:
              channel_2 = _a.sent();
              this.setState(function(prevState) {
                return {
                  channels: lodash_uniqby_1.default(
                    __spreadArrays([channel_2], prevState.channels),
                    'cid',
                  ),
                };
              });
              _a.label = 6;
            case 6:
              // remove from channel
              if (e.type === 'notification.removed_from_channel') {
                if (
                  this.props.onRemovedFromChannel &&
                  typeof this.props.onRemovedFromChannel === 'function'
                ) {
                  this.props.onRemovedFromChannel(this, e);
                } else {
                  this.setState(function(prevState) {
                    var channels = prevState.channels.filter(function(channel) {
                      return channel.cid !== e.channel.cid;
                    });
                    return {
                      channels: channels,
                    };
                  });
                }
              }
              // Update the channel with data
              if (e.type === 'channel.updated') {
                channels = this.state.channels;
                channelIndex = channels.findIndex(function(channel) {
                  return channel.cid === e.channel.cid;
                });
                if (channelIndex > -1) {
                  channels[channelIndex].data = seamless_immutable_1.default(
                    e.channel,
                  );
                  this.setState({
                    channels: __spreadArrays(channels),
                    channelUpdateCount: this.state.channelUpdateCount + 1,
                  });
                }
                if (
                  this.props.onChannelUpdated &&
                  typeof this.props.onChannelUpdated === 'function'
                ) {
                  this.props.onChannelUpdated(this, e);
                }
              }
              // Channel is deleted
              if (e.type === 'channel.deleted') {
                if (
                  this.props.onChannelDeleted &&
                  typeof this.props.onChannelDeleted === 'function'
                ) {
                  this.props.onChannelDeleted(this, e);
                } else {
                  channels = this.state.channels;
                  channelIndex = channels.findIndex(function(channel) {
                    return channel.cid === e.channel.cid;
                  });
                  if (channelIndex < 0) return [2 /*return*/];
                  // Remove the deleted channel from the list.s
                  channels.splice(channelIndex, 1);
                  this.setState({
                    channels: __spreadArrays(channels),
                    channelUpdateCount: this.state.channelUpdateCount + 1,
                  });
                }
              }
              if (e.type === 'channel.truncated') {
                this.setState(function(prevState) {
                  return {
                    channels: __spreadArrays(prevState.channels),
                    channelUpdateCount: prevState.channelUpdateCount + 1,
                  };
                });
                if (
                  this.props.onChannelTruncated &&
                  typeof this.props.onChannelTruncated === 'function'
                )
                  this.props.onChannelTruncated(this, e);
              }
              return [2 /*return*/, null];
          }
        });
      });
    };
    _this.getChannel = function(type, id) {
      return __awaiter(_this, void 0, void 0, function() {
        var channel;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              channel = this.props.client.channel(type, id);
              return [4 /*yield*/, channel.watch()];
            case 1:
              _a.sent();
              return [2 /*return*/, channel];
          }
        });
      });
    };
    _this.moveChannelUp = function(cid) {
      var channels = _this.state.channels;
      // get channel index
      var channelIndex = _this.state.channels.findIndex(function(channel) {
        return channel.cid === cid;
      });
      if (channelIndex <= 0) return;
      // get channel from channels
      var channel = channels[channelIndex];
      //remove channel from current position
      channels.splice(channelIndex, 1);
      //add channel at the start
      channels.unshift(channel);
      // set new channel state
      _this.setState({
        channels: __spreadArrays(channels),
      });
    };
    _this.loadNextPage = function() {
      _this.queryChannels();
    };
    // new channel list // *********************************
    _this._renderChannel = function(item) {
      var _a = _this.props,
        Preview = _a.Preview,
        setActiveChannel = _a.setActiveChannel,
        channel = _a.channel,
        watchers = _a.watchers;
      if (!item) return;
      var props = {
        channel: item,
        activeChannel: channel,
        Preview: Preview,
        setActiveChannel: setActiveChannel,
        watchers: watchers,
        key: item.id,
        // To force the update of preview component upon channel update.
        channelUpdateCount: _this.state.channelUpdateCount,
        connectionRecoveredCount: _this.state.connectionRecoveredCount,
      };
      return utils_2.smartRender(
        ChannelPreview_1.ChannelPreview,
        __assign({}, props),
      );
    };
    _this._handleClickOutside = function(e) {
      if (
        _this.channelListRef &&
        !_this.channelListRef.contains(e.target) &&
        _this.props.navOpen
      ) {
        _this.props.closeMobileNav();
      }
    };
    _this.state = {
      // list of channels
      channels: seamless_immutable_1.default([]),
      // loading channels
      loadingChannels: true,
      // error loading channels
      refreshing: false,
      hasNextPage: false,
      offset: 0,
      error: false,
      connectionRecoveredCount: 0,
      channelUpdateCount: 0,
    };
    _this.menuButton = react_1.default.createRef();
    return _this;
  }
  ChannelList.getDerivedStateFromError = function() {
    return { error: true };
  };
  ChannelList.prototype.componentDidCatch = function(error, info) {
    console.warn(error, info);
  };
  ChannelList.prototype.componentDidMount = function() {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.queryChannels()];
          case 1:
            _a.sent();
            document.addEventListener('click', this._handleClickOutside);
            this.listenToChanges();
            return [2 /*return*/];
        }
      });
    });
  };
  ChannelList.prototype.componentDidUpdate = function(prevProps) {
    return __awaiter(this, void 0, void 0, function() {
      return __generator(this, function(_a) {
        switch (_a.label) {
          case 0:
            if (!!deep_equal_1.default(prevProps.filters, this.props.filters))
              return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              this.setState({
                offset: 0,
                channels: seamless_immutable_1.default([]),
                loadingChannels: true,
                refreshing: false,
              }),
            ];
          case 1:
            _a.sent();
            return [4 /*yield*/, this.queryChannels()];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  ChannelList.prototype.componentWillUnmount = function() {
    document.removeEventListener('click', this._handleClickOutside);
    this.props.client.off(this.handleEvent);
  };
  ChannelList.prototype.listenToChanges = function() {
    this.props.client.on(this.handleEvent);
  };
  ChannelList.prototype.render = function() {
    var _this = this;
    var _a = this.props,
      List = _a.List,
      Paginator = _a.Paginator,
      EmptyStateIndicator = _a.EmptyStateIndicator;
    var _b = this.state,
      channels = _b.channels,
      loadingChannels = _b.loadingChannels,
      refreshing = _b.refreshing,
      hasNextPage = _b.hasNextPage;
    return react_1.default.createElement(
      react_1.default.Fragment,
      null,
      react_1.default.createElement(
        'div',
        {
          className:
            'str-chat str-chat-channel-list ' +
            this.props.theme +
            ' ' +
            (this.props.navOpen ? 'str-chat-channel-list--open' : ''),
          ref: function(ref) {
            return (_this.channelListRef = ref);
          },
        },
        react_1.default.createElement(
          List,
          {
            loading: loadingChannels,
            error: this.state.error,
            channels: channels,
            setActiveChannel: this.props.setActiveChannel,
            activeChannel: this.props.channel,
            showSidebar: this.props.showSidebar,
            LoadingIndicator: this.props.LoadingIndicator,
            LoadingErrorIndicator: this.props.LoadingErrorIndicator,
          },
          !channels.length
            ? react_1.default.createElement(EmptyStateIndicator, {
                listType: 'channel',
              })
            : utils_2.smartRender(Paginator, {
                loadNextPage: this.loadNextPage,
                hasNextPage: hasNextPage,
                refreshing: refreshing,
                children: channels.map(function(item) {
                  return _this._renderChannel(item);
                }),
              }),
        ),
      ),
    );
  };
  ChannelList.propTypes = {
    /**
     *
     *
     * Indicator for Empty State
     * */
    EmptyStateIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Available built-in options (also accepts the same props as):
     *
     * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
     * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
     * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
     *
     * The Preview to use, defaults to ChannelPreviewLastMessage
     * */
    Preview: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Loading indicator UI Component. It will be displayed until the channels are
     * being queried from API. Once the channels are loaded/queried, loading indicator is removed
     * and replaced with children of the Channel component.
     *
     * Defaults to and accepts same props as:
     * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
     *
     */
    LoadingIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
     * This error could be related to network or failing API.
     *
     * Defaults to and accepts same props as:
     * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
     *
     */
    LoadingErrorIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Custom UI Component for container of list of channels. Note that, list (UI component) of channels is passed
     * to this component as children. This component is for the purpose of adding header to channel list or styling container
     * for list of channels.
     *
     * Available built-in options (also accepts the same props as):
     *
     * 1. [ChannelListTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListTeam.js) (default)
     * 2. [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListMessenger.js)
     *
     * It has access to some additional props:
     *
     * - `setActiveChannel` {function} Check [chat context](https://getstream.github.io/stream-chat-react/#chat)
     * - `activeChannel` Currently active channel object
     * - `channels` {array} List of channels in channel list
     */
    List: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Paginator component for channels. It contains all the pagination logic such as
     * - fetching next page of results when needed e.g., when scroll reaches the end of list
     * - UI to display loading indicator when next page is being loaded
     * - call to action button to trigger loading of next page.
     *
     * Available built-in options (also accepts the same props as):
     *
     * 1. [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMorePaginator.js)
     * 2. [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator.js)
     */
    Paginator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Function that overrides default behaviour when new message is received on channel that is not being watched
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.message_new` event
     * */
    onMessageNew: prop_types_1.default.func,
    /**
     * Function that overrides default behaviour when users gets added to a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.added_to_channel` event
     * */
    onAddedToChannel: prop_types_1.default.func,
    /**
     * Function that overrides default behaviour when users gets removed from a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.removed_from_channel` event
     * */
    onRemovedFromChannel: prop_types_1.default.func,
    /**
     * Function that overrides default behaviour when channel gets updated
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.channel_updated` event
     * */
    onChannelUpdated: prop_types_1.default.func,
    /**
     * Function to customize behaviour when channel gets truncated
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `channel.truncated` event
     * */
    onChannelTruncated: prop_types_1.default.func,
    /**
     * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `channel.deleted` event
     * */
    onChannelDeleted: prop_types_1.default.func,
    /**
     * Object containing query filters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for filter.
     * */
    filters: prop_types_1.default.object,
    /**
     * Object containing query options
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for options.
     * */
    options: prop_types_1.default.object,
    /**
     * Object containing sort parameters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for sort.
     * */
    sort: prop_types_1.default.object,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: prop_types_1.default.object,
    /**
     * Set a Channel to be active and move it to the top of the list of channels by ID.
     * */
    customAciveChannel: prop_types_1.default.string,
    /**
     * Last channel will be set as active channel if true, defaults to true
     */
    setActiveChannelOnMount: prop_types_1.default.bool,
    /**
     * If true, channels won't be dynamically sorted by most recent message.
     */
    lockChannelOrder: prop_types_1.default.bool,
  };
  ChannelList.defaultProps = {
    Preview: ChannelPreviewLastMessage_1.ChannelPreviewLastMessage,
    LoadingIndicator: LoadingChannels_1.LoadingChannels,
    LoadingErrorIndicator: ChatDown_1.ChatDown,
    List: ChannelListTeam_1.ChannelListTeam,
    Paginator: LoadMorePaginator_1.LoadMorePaginator,
    EmptyStateIndicator: EmptyStateIndicator_1.EmptyStateIndicator,
    setActiveChannelOnMount: true,
    filters: {},
    options: {},
    sort: {},
    watchers: {},
  };
  return ChannelList;
})(react_1.PureComponent);
exports.ChannelList = ChannelList;
exports.ChannelList = ChannelList = context_1.withChatContext(ChannelList);
