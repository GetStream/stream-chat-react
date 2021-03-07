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
 * @type {React.FC<import('types').EmptyStateIndicatorProps>} param0
 */
var EmptyStateIndicator = function EmptyStateIndicator(_ref) {
  var listType = _ref.listType;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  if (listType === 'channel')
    return /*#__PURE__*/ _react.default.createElement(
      'p',
      null,
      t('You have no channels currently'),
    );
  if (listType === 'message') return null;
  return /*#__PURE__*/ _react.default.createElement(
    'p',
    null,
    'No items exist',
  );
};

EmptyStateIndicator.propTypes = {
  /** channel | message */
  listType: _propTypes.default.string.isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(EmptyStateIndicator);

exports.default = _default;
