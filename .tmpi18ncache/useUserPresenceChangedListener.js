'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useUserPresenceChangedListener = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 */
var useUserPresenceChangedListener = function useUserPresenceChangedListener(
  setChannels,
) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  (0, _react.useEffect)(function () {
    /** @param {import('stream-chat').Event} event */
    var handleEvent = function handleEvent(event) {
      setChannels(function (channels) {
        var newChannels = channels.map(function (channel) {
          var _event$user;

          if (
            !(
              (_event$user = event.user) !== null &&
              _event$user !== void 0 &&
              _event$user.id
            ) ||
            !channel.state.members[event.user.id]
          )
            return channel;
          var newChannel = channel; // dumb workaround for linter

          newChannel.state.members[event.user.id].user = event.user;
          return newChannel;
        });
        return (0, _toConsumableArray2.default)(newChannels);
      });
    };

    client.on('user.presence.changed', handleEvent);
    return function () {
      client.off('user.presence.changed', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

exports.useUserPresenceChangedListener = useUserPresenceChangedListener;
