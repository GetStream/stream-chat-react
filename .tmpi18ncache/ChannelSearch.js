'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

// @ts-check

/**
 * @type {React.FC}
 */
var ChannelSearch = function ChannelSearch() {
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__channel-search',
    },
    /*#__PURE__*/ _react.default.createElement('input', {
      type: 'text',
      placeholder: 'Search',
    }),
    /*#__PURE__*/ _react.default.createElement(
      'button',
      {
        type: 'submit',
      },
      /*#__PURE__*/ _react.default.createElement(
        'svg',
        {
          width: '18',
          height: '17',
          viewBox: '0 0 18 17',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        /*#__PURE__*/ _react.default.createElement('path', {
          d: 'M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z',
          fillRule: 'evenodd',
        }),
      ),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelSearch);

exports.default = _default;
