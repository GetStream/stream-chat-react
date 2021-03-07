'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _context = require('../../context');

// @ts-check

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ../../docs/LoadingErrorIndicator.md
 * @type {React.FC<import('types').LoadingErrorIndicatorProps>}
 */
var LoadingErrorIndicator = function LoadingErrorIndicator(_ref) {
  var error = _ref.error;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  if (!error) return null;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    null,
    t('Error: {{ errorMessage }}', {
      errorMessage: error.message,
    }),
  );
};

LoadingErrorIndicator.defaultProps = {
  error: null,
};
LoadingErrorIndicator.propTypes = {
  /** Error object */
  error: _propTypes.default.instanceOf(Error),
};

var _default = /*#__PURE__*/ _react.default.memo(LoadingErrorIndicator);

exports.default = _default;
