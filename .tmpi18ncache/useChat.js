'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useChat = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = require('react');

var _dayjs = _interopRequireDefault(require('dayjs'));

var _i18n = require('../../../i18n');

var _package = require('../../../../package.json');

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

var useChat = function useChat(_ref) {
  var _client$user;

  var client = _ref.client,
    initialNavOpen = _ref.initialNavOpen,
    i18nInstance = _ref.i18nInstance;

  var _useState = (0, _react.useState)(
      /** @type { Required<import('types').TranslationContextValue>} */
      {
        t:
          /** @param {string} key */
          function t(key) {
            return key;
          },
        tDateTimeParser: function tDateTimeParser(input) {
          return (0, _dayjs.default)(input);
        },
        userLanguage: '',
      },
    ),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    translators = _useState2[0],
    setTranslators = _useState2[1];

  var _useState3 = (0, _react.useState)(
      /** @type {import('stream-chat').Mute[]} */
      [],
    ),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    mutes = _useState4[0],
    setMutes = _useState4[1];

  var _useState5 = (0, _react.useState)(initialNavOpen),
    _useState6 = (0, _slicedToArray2.default)(_useState5, 2),
    navOpen = _useState6[0],
    setNavOpen = _useState6[1];

  var _useState7 = (0, _react.useState)(
      /** @type {ChannelState} */
      undefined,
    ),
    _useState8 = (0, _slicedToArray2.default)(_useState7, 2),
    channel = _useState8[0],
    setChannel = _useState8[1];

  var openMobileNav = function openMobileNav() {
    return setTimeout(function () {
      return setNavOpen(true);
    }, 100);
  };

  var closeMobileNav = function closeMobileNav() {
    return setNavOpen(false);
  };

  var clientMutes =
    client === null || client === void 0
      ? void 0
      : (_client$user = client.user) === null || _client$user === void 0
      ? void 0
      : _client$user.mutes;
  (0, _react.useEffect)(
    function () {
      if (client) {
        var userAgent = client.getUserAgent();

        if (!userAgent.includes('stream-chat-react')) {
          /**
           * results in something like: 'stream-chat-react-2.3.2-stream-chat-javascript-client-browser-2.2.2'
           */
          client.setUserAgent(
            'stream-chat-react-'
              .concat(_package.version, '-')
              .concat(userAgent),
          );
        }
      }
    },
    [client],
  );
  (0, _react.useEffect)(
    function () {
      setMutes(clientMutes || []);
      /** @param {import('stream-chat').Event} e */

      var handleEvent = function handleEvent(e) {
        var _e$me;

        if (e.type === 'notification.mutes_updated')
          setMutes(
            ((_e$me = e.me) === null || _e$me === void 0
              ? void 0
              : _e$me.mutes) || [],
          );
      };

      if (client) client.on(handleEvent);
      return function () {
        return client && client.off(handleEvent);
      };
    },
    [client, clientMutes],
  );
  (0, _react.useEffect)(
    function () {
      var streami18n;

      if (i18nInstance instanceof _i18n.Streami18n) {
        streami18n = i18nInstance;
      } else {
        streami18n = new _i18n.Streami18n({
          language: 'en',
        });
      }

      streami18n.registerSetLanguageCallback(function (t) {
        return setTranslators(function (prevTranslator) {
          return _objectSpread(
            _objectSpread({}, prevTranslator),
            {},
            {
              t,
            },
          );
        });
      });
      streami18n.getTranslators().then(function (translator) {
        if (translator) {
          var _client$user2;

          setTranslators(
            _objectSpread(
              _objectSpread({}, translator),
              {},
              {
                userLanguage:
                  (client === null || client === void 0
                    ? void 0
                    : (_client$user2 = client.user) === null ||
                      _client$user2 === void 0
                    ? void 0
                    : _client$user2.language) || '',
              },
            ),
          );
        }
      });
    },
    [client, i18nInstance],
  );
  var setActiveChannel = (0, _react.useCallback)(
    /*#__PURE__*/

    /**
     * @param {ChannelState} activeChannel
     * @param {{ limit?: number; offset?: number }} [watchers]
     * @param {React.BaseSyntheticEvent} [e]
     */
    (function () {
      var _ref2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee(
          activeChannel,
        ) {
          var watchers,
            e,
            _args = arguments;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  watchers =
                    _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
                  e = _args.length > 2 ? _args[2] : undefined;
                  if (e && e.preventDefault) e.preventDefault();

                  if (!(activeChannel && Object.keys(watchers).length)) {
                    _context.next = 6;
                    break;
                  }

                  _context.next = 6;
                  return activeChannel.query({
                    watch: true,
                    watchers,
                  });

                case 6:
                  setChannel(activeChannel);
                  closeMobileNav();

                case 8:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee);
        }),
      );

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    })(),
    [],
  );
  return {
    channel,
    closeMobileNav,
    mutes,
    navOpen,
    openMobileNav,
    setActiveChannel,
    translators,
  };
};

exports.useChat = useChat;
