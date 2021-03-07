'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useMobileNavigation = void 0;

var _react = require('react');

// @ts-check

/**
 * @param {React.MutableRefObject<HTMLDivElement | null>} channelListRef
 * @param {boolean} navOpen
 * @param {() => void} [closeMobileNav]
 */
var useMobileNavigation = function useMobileNavigation(
  channelListRef,
  navOpen,
  closeMobileNav,
) {
  (0, _react.useEffect)(
    function () {
      /** @param {MouseEvent} e */
      var handleClickOutside = function handleClickOutside(e) {
        if (
          closeMobileNav &&
          channelListRef.current &&
          !channelListRef.current.contains(
            /** @type {Node | null} */
            e.target,
          ) &&
          navOpen
        ) {
          closeMobileNav();
        }
      };

      document.addEventListener('click', handleClickOutside);
      return function () {
        document.removeEventListener('click', handleClickOutside);
      };
    },
    [navOpen, channelListRef, closeMobileNav],
  );
};

exports.useMobileNavigation = useMobileNavigation;
