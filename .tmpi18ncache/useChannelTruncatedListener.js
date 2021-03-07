'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useChannelTruncatedListener = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @typedef {import('stream-chat').Event} ChannelTruncatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelTruncatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */
var useChannelTruncatedListener = function useChannelTruncatedListener(
  setChannels,
  customHandler,
  forceUpdate,
) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  (0, _react.useEffect)(
    function () {
      /** @param {import('stream-chat').Event} e */
      var handleEvent = function handleEvent(e) {
        setChannels(function (channels) {
          return (0, _toConsumableArray2.default)(channels);
        });

        if (customHandler && typeof customHandler === 'function') {
          customHandler(setChannels, e);
        }

        if (forceUpdate) {
          forceUpdate();
        }
      };

      client.on('channel.truncated', handleEvent);
      return function () {
        client.off('channel.truncated', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [customHandler],
  );
};

exports.useChannelTruncatedListener = useChannelTruncatedListener;
