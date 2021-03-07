'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _context = require('../../context');

var _utils = require('../../utils');

var _ChannelListTeam = _interopRequireDefault(require('./ChannelListTeam'));

var _Avatar = require('../Avatar');

var _LoadMore = require('../LoadMore');

var _Loading = require('../Loading');

var _EmptyStateIndicator = require('../EmptyStateIndicator');

var _ChannelPreview = require('../ChannelPreview');

var _ChatDown = require('../ChatDown');

var _useMessageNewListener = require('./hooks/useMessageNewListener');

var _useNotificationMessageNewListener = require('./hooks/useNotificationMessageNewListener');

var _useNotificationAddedToChannelListener = require('./hooks/useNotificationAddedToChannelListener');

var _useNotificationRemovedFromChannelListener = require('./hooks/useNotificationRemovedFromChannelListener');

var _useChannelDeletedListener = require('./hooks/useChannelDeletedListener');

var _useChannelTruncatedListener = require('./hooks/useChannelTruncatedListener');

var _useChannelUpdatedListener = require('./hooks/useChannelUpdatedListener');

var _useChannelHiddenListener = require('./hooks/useChannelHiddenListener');

var _useChannelVisibleListener = require('./hooks/useChannelVisibleListener');

var _useConnectionRecoveredListener = require('./hooks/useConnectionRecoveredListener');

var _useUserPresenceChangedListener = require('./hooks/useUserPresenceChangedListener');

var _usePaginatedChannels2 = require('./hooks/usePaginatedChannels');

var _useMobileNavigation = require('./hooks/useMobileNavigation');

var _utils2 = require('./utils');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

var DEFAULT_FILTERS = {};
var DEFAULT_OPTIONS = {};
var DEFAULT_SORT = {};
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type {React.FC<import('types').ChannelListProps>}
 */

var ChannelList = function ChannelList(props) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client,
    setActiveChannel = _useContext.setActiveChannel,
    _useContext$navOpen = _useContext.navOpen,
    navOpen = _useContext$navOpen === void 0 ? false : _useContext$navOpen,
    closeMobileNav = _useContext.closeMobileNav,
    channel = _useContext.channel,
    theme = _useContext.theme;

  var channelListRef = (0, _react.useRef)(
    /** @type {HTMLDivElement | null} */
    null,
  );

  var _useState = (0, _react.useState)(0),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    channelUpdateCount = _useState2[0],
    setChannelUpdateCount = _useState2[1];
  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   * @param {import('stream-chat').Channel[]} channels
   * @param {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} setChannels
   */

  var activeChannelHandler = function activeChannelHandler(
    channels,
    setChannels,
  ) {
    var _props$setActiveChann = props.setActiveChannelOnMount,
      setActiveChannelOnMount =
        _props$setActiveChann === void 0 ? true : _props$setActiveChann,
      customActiveChannel = props.customActiveChannel,
      watchers = props.watchers,
      _props$options = props.options,
      options = _props$options === void 0 ? {} : _props$options;

    if (
      !channels ||
      channels.length === 0 ||
      channels.length > (options.limit || _utils2.MAX_QUERY_CHANNELS_LIMIT)
    ) {
      return;
    }

    if (customActiveChannel) {
      var customActiveChannelObject = channels.find(function (chan) {
        return chan.id === customActiveChannel;
      });

      if (customActiveChannelObject) {
        if (setActiveChannel) {
          setActiveChannel(customActiveChannelObject, watchers);
        }

        var newChannels = (0, _utils2.moveChannelUp)(
          customActiveChannelObject.cid,
          channels,
        );
        setChannels(newChannels);
      }

      return;
    }

    if (setActiveChannelOnMount && setActiveChannel) {
      setActiveChannel(channels[0], watchers);
    }
  }; // When channel list (channels array) is updated without any shallow changes (or with only deep changes), then we want
  // to force the channel preview to re-render.
  // This happens in case of event channel.updated, channel.truncated etc. Inner properties of channel is updated but
  // react renderer will only make shallow comparison and choose to not to re-render the UI.
  // By updating the dummy prop - channelUpdateCount, we can force this re-render.

  var forceUpdate = function forceUpdate() {
    setChannelUpdateCount(function (count) {
      return count + 1;
    });
  };

  var _usePaginatedChannels = (0, _usePaginatedChannels2.usePaginatedChannels)(
      client,
      props.filters || DEFAULT_FILTERS,
      props.sort || DEFAULT_SORT,
      props.options || DEFAULT_OPTIONS,
      activeChannelHandler,
    ),
    channels = _usePaginatedChannels.channels,
    loadNextPage = _usePaginatedChannels.loadNextPage,
    hasNextPage = _usePaginatedChannels.hasNextPage,
    status = _usePaginatedChannels.status,
    setChannels = _usePaginatedChannels.setChannels;

  var loadedChannels = props.channelRenderFilterFn
    ? props.channelRenderFilterFn(channels)
    : channels;
  (0, _useMobileNavigation.useMobileNavigation)(
    channelListRef,
    navOpen,
    closeMobileNav,
  ); // All the event listeners

  (0, _useMessageNewListener.useMessageNewListener)(
    setChannels,
    props.lockChannelOrder,
    props.allowNewMessagesFromUnfilteredChannels,
  );
  (0, _useNotificationMessageNewListener.useNotificationMessageNewListener)(
    setChannels,
    props.onMessageNew,
  );
  (0,
  _useNotificationAddedToChannelListener.useNotificationAddedToChannelListener)(
    setChannels,
    props.onAddedToChannel,
  );
  (0,
  _useNotificationRemovedFromChannelListener.useNotificationRemovedFromChannelListener)(
    setChannels,
    props.onRemovedFromChannel,
  );
  (0, _useChannelDeletedListener.useChannelDeletedListener)(
    setChannels,
    props.onChannelDeleted,
  );
  (0, _useChannelHiddenListener.useChannelHiddenListener)(
    setChannels,
    props.onChannelHidden,
  );
  (0, _useChannelVisibleListener.useChannelVisibleListener)(
    setChannels,
    props.onChannelVisible,
  );
  (0, _useChannelTruncatedListener.useChannelTruncatedListener)(
    setChannels,
    props.onChannelTruncated,
    forceUpdate,
  );
  (0, _useChannelUpdatedListener.useChannelUpdatedListener)(
    setChannels,
    props.onChannelUpdated,
    forceUpdate,
  );
  (0, _useConnectionRecoveredListener.useConnectionRecoveredListener)(
    forceUpdate,
  );
  (0, _useUserPresenceChangedListener.useUserPresenceChangedListener)(
    setChannels,
  ); // If the active channel is deleted, then unset the active channel.

  (0, _react.useEffect)(
    function () {
      /** @param {import('stream-chat').Event} e */
      var handleEvent = function handleEvent(e) {
        if (
          setActiveChannel &&
          (e === null || e === void 0 ? void 0 : e.cid) ===
            (channel === null || channel === void 0 ? void 0 : channel.cid)
        ) {
          setActiveChannel();
        }
      };

      client.on('channel.deleted', handleEvent);
      client.on('channel.hidden', handleEvent);
      return function () {
        client.off('channel.deleted', handleEvent);
        client.off('channel.hidden', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [channel],
  ); // renders the channel preview or item

  /** @param {import('stream-chat').Channel} item */

  var renderChannel = function renderChannel(item) {
    if (!item) return null;
    var _props$Avatar = props.Avatar,
      Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar,
      _props$Preview = props.Preview,
      Preview =
        _props$Preview === void 0
          ? _ChannelPreview.ChannelPreviewLastMessage
          : _props$Preview,
      _props$watchers = props.watchers,
      watchers = _props$watchers === void 0 ? {} : _props$watchers;
    var previewProps = {
      Avatar,
      channel: item,
      Preview,
      activeChannel: channel,
      setActiveChannel,
      watchers,
      key: item.id,
      // To force the update of preview component upon channel update.
      channelUpdateCount,
    };
    return (0, _utils.smartRender)(
      _ChannelPreview.ChannelPreview,
      _objectSpread({}, previewProps),
    );
  }; // renders the empty state indicator (when there are no channels)

  var renderEmptyStateIndicator = function renderEmptyStateIndicator() {
    var _props$EmptyStateIndi = props.EmptyStateIndicator,
      EmptyStateIndicator =
        _props$EmptyStateIndi === void 0
          ? _EmptyStateIndicator.EmptyStateIndicator
          : _props$EmptyStateIndi;
    return /*#__PURE__*/ _react.default.createElement(EmptyStateIndicator, {
      listType: 'channel',
    });
  }; // renders the list.

  var renderList = function renderList() {
    var _props$Avatar2 = props.Avatar,
      Avatar = _props$Avatar2 === void 0 ? _Avatar.Avatar : _props$Avatar2,
      _props$List = props.List,
      List = _props$List === void 0 ? _ChannelListTeam.default : _props$List,
      _props$Paginator = props.Paginator,
      Paginator =
        _props$Paginator === void 0
          ? _LoadMore.LoadMorePaginator
          : _props$Paginator,
      showSidebar = props.showSidebar,
      _props$LoadingIndicat = props.LoadingIndicator,
      LoadingIndicator =
        _props$LoadingIndicat === void 0
          ? _Loading.LoadingChannels
          : _props$LoadingIndicat,
      _props$LoadingErrorIn = props.LoadingErrorIndicator,
      LoadingErrorIndicator =
        _props$LoadingErrorIn === void 0
          ? _ChatDown.ChatDown
          : _props$LoadingErrorIn;
    return /*#__PURE__*/ _react.default.createElement(
      List,
      {
        loading: status.loadingChannels,
        error: status.error,
        showSidebar: showSidebar,
        Avatar: Avatar,
        LoadingIndicator: LoadingIndicator,
        LoadingErrorIndicator: LoadingErrorIndicator,
      },
      !loadedChannels || loadedChannels.length === 0
        ? renderEmptyStateIndicator()
        : (0, _utils.smartRender)(Paginator, {
            loadNextPage,
            hasNextPage,
            refreshing: status.refreshing,
            children: loadedChannels.map(renderChannel),
          }),
    );
  };

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat str-chat-channel-list '
          .concat(theme, ' ')
          .concat(navOpen ? 'str-chat-channel-list--open' : ''),
        ref: channelListRef,
      },
      renderList(),
    ),
  );
};

ChannelList.propTypes = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /** Indicator for Empty State */
  EmptyStateIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').EmptyStateIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ChannelPreviewUIComponentProps>>} */
    _propTypes.default.elementType,

  /**
   * Loading indicator UI Component. It will be displayed until the channels are
   * being queried from API. Once the channels are loaded/queried, loading indicator is removed
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
   * This error could be related to network or failing API.
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */
    _propTypes.default.elementType,

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
  List:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ChannelListUIComponentProps>>} */
    _propTypes.default.elementType,

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
  Paginator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').PaginatorProps>>} */
    _propTypes.default.elementType,

  /**
   * Function that overrides default behaviour when new message is received on channel that is not being watched
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.message_new` event
   * */
  onMessageNew: _propTypes.default.func,

  /**
   * Function that overrides default behaviour when users gets added to a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel: _propTypes.default.func,

  /**
   * Function that overrides default behaviour when users gets removed from a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel: _propTypes.default.func,

  /**
   * Function that overrides default behaviour when channel gets updated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.channel_updated` event
   * */
  onChannelUpdated: _propTypes.default.func,

  /**
   * Function to customize behaviour when channel gets truncated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.truncated` event
   * */
  onChannelTruncated: _propTypes.default.func,

  /**
   * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.deleted` event
   * */
  onChannelDeleted: _propTypes.default.func,

  /**
   * Optional function to filter channels prior to loading in the DOM. Do not use any complex or async logic here that would significantly delay the loading of the ChannelList.
   * We recommend using a pure function with array methods like filter/sort/reduce.
   * @param {Array} channels
   * @returns {Array} channels
   * */
  channelRenderFilterFn:
    /** @type {PropTypes.Validator<(channels: import('stream-chat').Channel[]) => import('stream-chat').Channel[]>} */
    _propTypes.default.func,

  /**
   * Object containing query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for filter.
   * */
  filters:
    /** @type {PropTypes.Validator<import('stream-chat').ChannelFilters>} */
    _propTypes.default.object,

  /**
   * Object containing query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for options.
   * */
  options: _propTypes.default.object,

  /**
   * Object containing sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for sort.
   * */
  sort:
    /** @type {PropTypes.Validator<import('stream-chat').ChannelSort>} */
    _propTypes.default.object,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/channel_pagination/?language=js) for a list of available fields for sort.
   * */
  watchers:
    /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */
    _propTypes.default.object,

  /**
   * Set a Channel (of this id) to be active and move it to the top of the list of channels by ID.
   * */
  customActiveChannel: _propTypes.default.string,

  /**
   * Last channel will be set as active channel if true, defaults to true
   */
  setActiveChannelOnMount: _propTypes.default.bool,

  /**
   * If true, channels won't be dynamically sorted by most recent message.
   */
  lockChannelOrder: _propTypes.default.bool,

  /**
   * When client receives an event `message.new`, we push that channel to top of the list.
   *
   * But If the channel doesn't exist in the list, then we get the channel from client
   * (client maintains list of watched channels as `client.activeChannels`) and push
   * that channel to top of the list by default. You can disallow this behavior by setting following
   * prop to false. This is quite usefull where you have multiple tab structure and you don't want
   * ChannelList in Tab1 to react to new message on some channel in Tab2.
   *
   * Default value is true.
   */
  allowNewMessagesFromUnfilteredChannels: _propTypes.default.bool,
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelList);

exports.default = _default;
