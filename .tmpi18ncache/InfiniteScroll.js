'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _objectWithoutProperties2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectWithoutProperties'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 * @param {Event} e
 */
var mousewheelListener = function mousewheelListener(e) {
  if (e instanceof WheelEvent && e.deltaY === 1) {
    e.preventDefault();
  }
};
/**
 * @param {HTMLElement | Element | null} el
 * @returns {number}
 */

var calculateTopPosition = function calculateTopPosition(el) {
  if (el instanceof HTMLElement) {
    return el.offsetTop + calculateTopPosition(el.offsetParent);
  }

  return 0;
};
/**
 * Computes by recursively summing offsetTop until an element without offsetParent is reached
 * @param {HTMLElement} el
 * @param {number} scrollTop
 */

var calculateOffset = function calculateOffset(el, scrollTop) {
  if (!el) {
    return 0;
  }

  return (
    calculateTopPosition(el) +
    (el.offsetHeight - scrollTop - window.innerHeight)
  );
};
/** @param {import("types").InfiniteScrollProps} props */

var InfiniteScroll = function InfiniteScroll(_ref) {
  var children = _ref.children,
    _ref$element = _ref.element,
    element = _ref$element === void 0 ? 'div' : _ref$element,
    _ref$hasMore = _ref.hasMore,
    hasMore = _ref$hasMore === void 0 ? false : _ref$hasMore,
    _ref$initialLoad = _ref.initialLoad,
    initialLoad = _ref$initialLoad === void 0 ? true : _ref$initialLoad,
    _ref$isReverse = _ref.isReverse,
    isReverse = _ref$isReverse === void 0 ? false : _ref$isReverse,
    loader = _ref.loader,
    loadMore = _ref.loadMore,
    _ref$threshold = _ref.threshold,
    threshold = _ref$threshold === void 0 ? 250 : _ref$threshold,
    _ref$useCapture = _ref.useCapture,
    useCapture = _ref$useCapture === void 0 ? false : _ref$useCapture,
    _ref$useWindow = _ref.useWindow,
    useWindow = _ref$useWindow === void 0 ? true : _ref$useWindow,
    _ref$isLoading = _ref.isLoading,
    isLoading = _ref$isLoading === void 0 ? false : _ref$isLoading,
    listenToScroll = _ref.listenToScroll,
    elementProps = (0, _objectWithoutProperties2.default)(_ref, [
      'children',
      'element',
      'hasMore',
      'initialLoad',
      'isReverse',
      'loader',
      'loadMore',
      'threshold',
      'useCapture',
      'useWindow',
      'isLoading',
      'listenToScroll',
    ]);
  var scrollComponent = (0, _react.useRef)(
    /** @type {HTMLElement | null} */
    null,
  );
  var scrollListener = (0, _react.useCallback)(
    function () {
      var el = scrollComponent.current;
      if (!el) return;
      var parentElement = el.parentElement;
      var offset = 0;
      var reverseOffset = 0;

      if (useWindow) {
        var doc =
          document.documentElement || document.body.parentNode || document.body;
        var scrollTop =
          window.pageYOffset !== undefined ? window.pageYOffset : doc.scrollTop;
        offset = calculateOffset(el, scrollTop);
        reverseOffset = scrollTop;
      } else if (parentElement) {
        offset =
          el.scrollHeight -
          parentElement.scrollTop -
          parentElement.clientHeight;
        reverseOffset = parentElement.scrollTop;
      }

      if (listenToScroll) {
        listenToScroll(offset, reverseOffset, threshold);
      } // Here we make sure the element is visible as well as checking the offset

      if (
        (isReverse ? reverseOffset : offset) < Number(threshold) &&
        el.offsetParent !== null &&
        typeof loadMore === 'function' &&
        hasMore
      ) {
        loadMore();
      }
    },
    [hasMore, useWindow, isReverse, threshold, listenToScroll, loadMore],
  );
  (0, _react.useEffect)(
    function () {
      var _scrollComponent$curr;

      var scrollEl = useWindow
        ? window
        : (_scrollComponent$curr = scrollComponent.current) === null ||
          _scrollComponent$curr === void 0
        ? void 0
        : _scrollComponent$curr.parentNode;

      if (isLoading || !scrollEl) {
        return function () {};
      }

      scrollEl.addEventListener('scroll', scrollListener, useCapture);
      scrollEl.addEventListener('resize', scrollListener, useCapture);

      if (initialLoad) {
        scrollListener();
      }

      return function () {
        scrollEl.removeEventListener('scroll', scrollListener, useCapture);
        scrollEl.removeEventListener('resize', scrollListener, useCapture);
      };
    },
    [initialLoad, isLoading, scrollListener, useCapture, useWindow],
  );
  (0, _react.useEffect)(
    function () {
      var _scrollComponent$curr2;

      var scrollEl = useWindow
        ? window
        : (_scrollComponent$curr2 = scrollComponent.current) === null ||
          _scrollComponent$curr2 === void 0
        ? void 0
        : _scrollComponent$curr2.parentNode;
      if (!scrollEl) return function () {};
      scrollEl.addEventListener('mousewheel', mousewheelListener, useCapture);
      return function () {
        return scrollEl.removeEventListener(
          'mousewheel',
          mousewheelListener,
          useCapture,
        );
      };
    },
    [useCapture, useWindow],
  );

  var attributes = _objectSpread(
    _objectSpread({}, elementProps),
    {},
    {
      /** @param {HTMLElement} e */
      ref: function ref(e) {
        scrollComponent.current = e;
      },
    },
  );

  var childrenArray = [children];

  if (isLoading && loader) {
    if (isReverse) {
      childrenArray.unshift(loader);
    } else {
      childrenArray.push(loader);
    }
  }

  return /*#__PURE__*/ _react.default.createElement(
    element,
    attributes,
    childrenArray,
  );
};

InfiniteScroll.propTypes = {
  element: _propTypes.default.elementType,
  hasMore: _propTypes.default.bool,
  initialLoad: _propTypes.default.bool,
  isReverse: _propTypes.default.bool,
  loader: _propTypes.default.node,
  loadMore: _propTypes.default.func.isRequired,
  pageStart: _propTypes.default.number,
  isLoading: _propTypes.default.bool,
  threshold: _propTypes.default.number,
  useCapture: _propTypes.default.bool,
  useWindow: _propTypes.default.bool,
};
var _default = InfiniteScroll;
exports.default = _default;
