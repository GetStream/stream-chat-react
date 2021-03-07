'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = require('react');

// @ts-check

/**
 * @type {import('types').useMentionsHandlers}
 */
var useMentionsHandlers = function useMentionsHandlers(
  onMentionsHover,
  onMentionsClick,
) {
  return (0, _react.useCallback)(
    function (e, mentioned_users) {
      if (!onMentionsHover && !onMentionsClick) return; // eslint-disable-next-line prefer-destructuring

      var target =
        /** @type {HTMLSpanElement} */
        e.target;
      var tagName =
        target === null || target === void 0
          ? void 0
          : target.tagName.toLowerCase();
      var textContent =
        target === null || target === void 0
          ? void 0
          : target.innerHTML.replace('*', '');

      if (tagName === 'strong' && textContent[0] === '@') {
        var userName = textContent.replace('@', '');
        var user = mentioned_users.find(function (_ref) {
          var name = _ref.name,
            id = _ref.id;
          return name === userName || id === userName;
        });

        if (
          onMentionsHover &&
          typeof onMentionsHover === 'function' &&
          e.type === 'mouseover'
        ) {
          onMentionsHover(e, user);
        }

        if (
          onMentionsClick &&
          e.type === 'click' &&
          typeof onMentionsClick === 'function'
        ) {
          onMentionsClick(e, user);
        }
      }
    },
    [onMentionsClick, onMentionsHover],
  );
};

var _default = useMentionsHandlers;
exports.default = _default;
