'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @type {import('types').useEditMessageHandler}
 */
var useEditMessageHandler = function useEditMessageHandler(
  doUpdateMessageRequest,
) {
  var _useContext = (0, _react.useContext)(_context.ChatContext),
    channel = _useContext.channel,
    client = _useContext.client;

  return function (updatedMessage) {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage),
      );
    }

    return client.updateMessage(updatedMessage);
  };
};

var _default = useEditMessageHandler;
exports.default = _default;
