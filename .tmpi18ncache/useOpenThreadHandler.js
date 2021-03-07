'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useOpenThreadHandler = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/**
 * @type {import('types').useOpenThreadHandler}
 */
var useOpenThreadHandler = function useOpenThreadHandler(
  message,
  customOpenThread,
) {
  /**
   * @type{import('types').ChannelContextValue}
   */
  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channelOpenThread = _useContext.openThread;

  var openThread = customOpenThread || channelOpenThread;
  return function (event) {
    if (!openThread || !message) {
      console.warn(
        'Open thread handler was called but it is missing one of its parameters',
      );
      return;
    }

    openThread(message, event);
  };
};

exports.useOpenThreadHandler = useOpenThreadHandler;
