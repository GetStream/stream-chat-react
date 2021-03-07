'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useMentionsUIHandler = exports.useMentionsHandler = void 0;

var _react = require('react');

var _context = require('../../../context');

// @ts-check

/** @type {(fn: Function | undefined, message: import('stream-chat').MessageResponse | undefined) => React.EventHandler<React.SyntheticEvent>} * */
function createEventHandler(fn, message) {
  return function (e) {
    if (
      typeof fn !== 'function' ||
      !(message !== null && message !== void 0 && message.mentioned_users)
    ) {
      return;
    }

    fn(e, message.mentioned_users);
  };
}
/**
 * @type {import('types').useMentionsHandler}
 */

var useMentionsHandler = function useMentionsHandler(
  message,
  customMentionHandler,
) {
  /**
   * @type{import('types').ChannelContextValue}
   */
  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channelOnMentionsClick = _useContext.onMentionsClick,
    channelOnMentionsHover = _useContext.onMentionsHover;

  var onMentionsClick =
    (customMentionHandler === null || customMentionHandler === void 0
      ? void 0
      : customMentionHandler.onMentionsClick) ||
    channelOnMentionsClick ||
    function () {};

  var onMentionsHover =
    (customMentionHandler === null || customMentionHandler === void 0
      ? void 0
      : customMentionHandler.onMentionsHover) ||
    channelOnMentionsHover ||
    function () {};

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick: createEventHandler(onMentionsClick, message),

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover: createEventHandler(onMentionsHover, message),
  };
};
/**
 * @type {import('types').useMentionsUIHandler}
 */

exports.useMentionsHandler = useMentionsHandler;

var useMentionsUIHandler = function useMentionsUIHandler(
  message,
  eventHandlers,
) {
  /**
   * @type{import('types').ChannelContextValue}
   */
  var _useContext2 = (0, _react.useContext)(_context.ChannelContext),
    onMentionsClick = _useContext2.onMentionsClick,
    onMentionsHover = _useContext2.onMentionsHover;

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick:
      (eventHandlers === null || eventHandlers === void 0
        ? void 0
        : eventHandlers.onMentionsClick) ||
      createEventHandler(onMentionsClick, message),

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover:
      (eventHandlers === null || eventHandlers === void 0
        ? void 0
        : eventHandlers.onMentionsHover) ||
      createEventHandler(onMentionsHover, message),
  };
};

exports.useMentionsUIHandler = useMentionsUIHandler;
