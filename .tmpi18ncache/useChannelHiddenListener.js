'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useChannelHiddenListener = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @typedef {import('stream-chat').Event} ChannelHiddenEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelHiddenEvent) => void} [customHandler]
 */
var useChannelHiddenListener = function useChannelHiddenListener(
  setChannels,
  customHandler,
) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  (0, _react.useEffect)(
    function () {
      /** @param {import('stream-chat').Event} e */
      var handleEvent = function handleEvent(e) {
        if (customHandler && typeof customHandler === 'function') {
          customHandler(setChannels, e);
        } else {
          setChannels(function (channels) {
            var channelIndex = channels.findIndex(function (channel) {
              return (
                channel.cid === (e === null || e === void 0 ? void 0 : e.cid)
              );
            });
            if (channelIndex < 0)
              return (0, _toConsumableArray2.default)(channels); // Remove the hidden channel from the list.s

            channels.splice(channelIndex, 1); // eslint-disable-next-line consistent-return

            return (0, _toConsumableArray2.default)(channels);
          });
        }
      };

      client.on('channel.hidden', handleEvent);
      return function () {
        client.off('channel.hidden', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [customHandler],
  );
};

exports.useChannelHiddenListener = useChannelHiddenListener;
