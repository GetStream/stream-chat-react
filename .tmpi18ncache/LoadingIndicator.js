'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

// @ts-check

/**
 * LoadingIndicator - Just a simple loading spinner..
 *
 * @example ../../docs/LoadingIndicator.md
 * @type { React.FC<import('types').LoadingIndicatorProps>}
 */
var LoadingIndicator = function LoadingIndicator(_ref) {
  var _ref$size = _ref.size,
    size = _ref$size === void 0 ? 15 : _ref$size,
    _ref$color = _ref.color,
    color = _ref$color === void 0 ? '#006CFF' : _ref$color;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__loading-indicator '.concat(color),
      'data-testid': 'loading-indicator-wrapper',
      style: {
        width: size,
        height: size,
      },
    },
    /*#__PURE__*/ _react.default.createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 30 30',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      /*#__PURE__*/ _react.default.createElement(
        'defs',
        null,
        /*#__PURE__*/ _react.default.createElement(
          'linearGradient',
          {
            x1: '50%',
            y1: '0%',
            x2: '50%',
            y2: '100%',
            id: 'a',
          },
          /*#__PURE__*/ _react.default.createElement('stop', {
            stopColor: '#FFF',
            stopOpacity: '0',
            offset: '0%',
          }),
          /*#__PURE__*/ _react.default.createElement('stop', {
            offset: '100%',
            'data-testid': 'loading-indicator-circle',
            stopColor: color,
            stopOpacity: '1',
            style: {
              stopColor: color,
            },
          }),
        ),
      ),
      /*#__PURE__*/ _react.default.createElement('path', {
        d:
          'M2.518 23.321l1.664-1.11A12.988 12.988 0 0 0 15 28c7.18 0 13-5.82 13-13S22.18 2 15 2V0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-5.206 0-9.792-2.652-12.482-6.679z',
        fill: 'url(#a)',
        fillRule: 'evenodd',
      }),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(LoadingIndicator);

exports.default = _default;
