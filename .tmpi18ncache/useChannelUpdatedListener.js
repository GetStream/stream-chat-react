'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useChannelUpdatedListener = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @typedef {import('stream-chat').Event} ChannelUpdatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelUpdatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */
var useChannelUpdatedListener = function useChannelUpdatedListener(
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
          var channelIndex = channels.findIndex(function (channel) {
            var _e$channel;

            return (
              channel.cid ===
              ((_e$channel = e.channel) === null || _e$channel === void 0
                ? void 0
                : _e$channel.cid)
            );
          });

          if (channelIndex > -1 && e.channel) {
            var newChannels = channels;
            newChannels[channelIndex].data = e.channel;
            return (0, _toConsumableArray2.default)(newChannels);
          }

          return channels;
        });

        if (forceUpdate) {
          forceUpdate();
        }

        if (customHandler && typeof customHandler === 'function') {
          customHandler(setChannels, e);
        }
      };

      client.on('channel.updated', handleEvent);
      return function () {
        client.off('channel.updated', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [customHandler],
  );
};

exports.useChannelUpdatedListener = useChannelUpdatedListener;
