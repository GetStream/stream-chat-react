'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.usePaginatedChannels = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = require('react');

var _utils = require('../utils');

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

/**
 * @typedef {import('stream-chat').Channel} Channel
 * @param {import('types').StreamChatReactClient} client
 * @param {import('stream-chat').ChannelFilters} filters
 * @param {import('stream-chat').ChannelSort} [sort]
 * @param {import('stream-chat').ChannelOptions} [options]
 * @param {(channels: Channel[], setChannels: React.Dispatch<React.SetStateAction<Channel[]>>) => void} [activeChannelHandler]
 */
var usePaginatedChannels = function usePaginatedChannels(
  client,
  filters,
  sort,
  options,
  activeChannelHandler,
) {
  var _useState = (0, _react.useState)(
      /** @type {Channel[]} */
      [],
    ),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    channels = _useState2[0],
    setChannels = _useState2[1];

  var _useState3 = (0, _react.useState)(true),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    loadingChannels = _useState4[0],
    setLoadingChannels = _useState4[1];

  var _useState5 = (0, _react.useState)(true),
    _useState6 = (0, _slicedToArray2.default)(_useState5, 2),
    refreshing = _useState6[0],
    setRefreshing = _useState6[1];

  var _useState7 = (0, _react.useState)(0),
    _useState8 = (0, _slicedToArray2.default)(_useState7, 2),
    offset = _useState8[0],
    setOffset = _useState8[1];

  var _useState9 = (0, _react.useState)(false),
    _useState10 = (0, _slicedToArray2.default)(_useState9, 2),
    error = _useState10[0],
    setError = _useState10[1];

  var _useState11 = (0, _react.useState)(true),
    _useState12 = (0, _slicedToArray2.default)(_useState11, 2),
    hasNextPage = _useState12[0],
    setHasNextPage = _useState12[1];

  var filterString = (0, _react.useMemo)(
    function () {
      return JSON.stringify(filters);
    },
    [filters],
  );
  /**
   * @param {string} [queryType]
   */

  var queryChannels = /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(queryType) {
        var _options$limit;

        var newOptions, channelQueryResponse, newChannels;
        return _regenerator.default.wrap(
          function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  if (queryType === 'reload') {
                    setChannels([]);
                    setLoadingChannels(true);
                  }

                  setRefreshing(true);
                  newOptions = _objectSpread(
                    _objectSpread(
                      {
                        offset: queryType === 'reload' ? 0 : offset,
                      },
                      options,
                    ),
                    {},
                    {
                      limit:
                        (_options$limit =
                          options === null || options === void 0
                            ? void 0
                            : options.limit) !== null &&
                        _options$limit !== void 0
                          ? _options$limit
                          : _utils.MAX_QUERY_CHANNELS_LIMIT,
                    },
                  );
                  _context.prev = 3;
                  _context.next = 6;
                  return client.queryChannels(filters, sort || {}, newOptions);

                case 6:
                  channelQueryResponse = _context.sent;

                  if (queryType === 'reload') {
                    newChannels = channelQueryResponse;
                  } else {
                    newChannels = [].concat(
                      (0, _toConsumableArray2.default)(channels),
                      (0, _toConsumableArray2.default)(channelQueryResponse),
                    );
                  }

                  setChannels(newChannels);
                  setHasNextPage(
                    channelQueryResponse.length >= newOptions.limit,
                  ); // Set active channel only after first page.

                  if (offset === 0 && activeChannelHandler) {
                    activeChannelHandler(newChannels, setChannels);
                  }

                  setOffset(newChannels.length);
                  _context.next = 18;
                  break;

                case 14:
                  _context.prev = 14;
                  _context.t0 = _context['catch'](3);
                  console.warn(_context.t0);
                  setError(true);

                case 18:
                  setLoadingChannels(false);
                  setRefreshing(false);

                case 20:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [[3, 14]],
        );
      }),
    );

    return function queryChannels(_x) {
      return _ref.apply(this, arguments);
    };
  })();

  var loadNextPage = function loadNextPage() {
    queryChannels();
  };

  (0, _react.useEffect)(
    function () {
      queryChannels('reload'); // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [filterString],
  );
  return {
    channels,
    loadNextPage,
    hasNextPage,
    status: {
      loadingChannels,
      refreshing,
      error,
    },
    setChannels,
  };
};

exports.usePaginatedChannels = usePaginatedChannels;
