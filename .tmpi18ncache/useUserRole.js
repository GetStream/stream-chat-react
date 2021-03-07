'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useUserRole = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @type {import('types').useUserRole}
 */
var useUserRole = function useUserRole(message) {
  var _client$user,
    _channel$state,
    _channel$state$member,
    _channel$state2,
    _channel$state2$membe,
    _client$user2,
    _channel$state3,
    _channel$state3$membe,
    _channel$state4,
    _channel$state4$membe;

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    client = _useContext.client,
    channel = _useContext.channel;

  var isMyMessage =
    !!(message !== null && message !== void 0 && message.user) &&
    !!(client !== null && client !== void 0 && client.user) &&
    client.user.id === message.user.id;
  var isAdmin =
    (client === null || client === void 0
      ? void 0
      : (_client$user = client.user) === null || _client$user === void 0
      ? void 0
      : _client$user.role) === 'admin' ||
    (channel === null || channel === void 0
      ? void 0
      : (_channel$state = channel.state) === null || _channel$state === void 0
      ? void 0
      : (_channel$state$member = _channel$state.membership) === null ||
        _channel$state$member === void 0
      ? void 0
      : _channel$state$member.role) === 'admin';
  var isOwner =
    (channel === null || channel === void 0
      ? void 0
      : (_channel$state2 = channel.state) === null || _channel$state2 === void 0
      ? void 0
      : (_channel$state2$membe = _channel$state2.membership) === null ||
        _channel$state2$membe === void 0
      ? void 0
      : _channel$state2$membe.role) === 'owner';
  var isModerator =
    (client === null || client === void 0
      ? void 0
      : (_client$user2 = client.user) === null || _client$user2 === void 0
      ? void 0
      : _client$user2.role) === 'channel_moderator' ||
    (channel === null || channel === void 0
      ? void 0
      : (_channel$state3 = channel.state) === null || _channel$state3 === void 0
      ? void 0
      : (_channel$state3$membe = _channel$state3.membership) === null ||
        _channel$state3$membe === void 0
      ? void 0
      : _channel$state3$membe.role) === 'channel_moderator' ||
    (channel === null || channel === void 0
      ? void 0
      : (_channel$state4 = channel.state) === null || _channel$state4 === void 0
      ? void 0
      : (_channel$state4$membe = _channel$state4.membership) === null ||
        _channel$state4$membe === void 0
      ? void 0
      : _channel$state4$membe.role) === 'moderator';
  var canEditMessage = isMyMessage || isModerator || isOwner || isAdmin;
  var canDeleteMessage = canEditMessage;
  return {
    isMyMessage,
    isAdmin,
    isOwner,
    isModerator,
    canEditMessage,
    canDeleteMessage,
  };
};

exports.useUserRole = useUserRole;
