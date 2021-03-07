'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useUserHandler = void 0;

// @ts-check

/**
 * @type {import('types').useUserHandler}
 */
var useUserHandler = function useUserHandler(message, eventHandlers) {
  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserClick: function onUserClick(e) {
      if (
        typeof (eventHandlers === null || eventHandlers === void 0
          ? void 0
          : eventHandlers.onUserClickHandler) !== 'function' ||
        !(message !== null && message !== void 0 && message.user)
      ) {
        return;
      }

      eventHandlers.onUserClickHandler(e, message.user);
    },

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserHover: function onUserHover(e) {
      if (
        typeof (eventHandlers === null || eventHandlers === void 0
          ? void 0
          : eventHandlers.onUserHoverHandler) !== 'function' ||
        !(message !== null && message !== void 0 && message.user)
      ) {
        return;
      }

      eventHandlers.onUserHoverHandler(e, message.user);
    },
  };
};

exports.useUserHandler = useUserHandler;
