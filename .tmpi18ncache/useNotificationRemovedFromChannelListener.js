'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useNotificationRemovedFromChannelListener = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @typedef {import('stream-chat').Event} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */
var useNotificationRemovedFromChannelListener = function useNotificationRemovedFromChannelListener(
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
            return channels.filter(function (channel) {
              var _e$channel;

              return (
                channel.cid !==
                ((_e$channel = e.channel) === null || _e$channel === void 0
                  ? void 0
                  : _e$channel.cid)
              );
            });
          });
        }
      };

      client.on('notification.removed_from_channel', handleEvent);
      return function () {
        client.off('notification.removed_from_channel', handleEvent);
      }; // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [customHandler],
  );
};

exports.useNotificationRemovedFromChannelListener = useNotificationRemovedFromChannelListener;
