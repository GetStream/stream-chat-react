'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

// @ts-check

/**
 * Modal - Custom Image component used in modal
 * @type {React.FC<import('types').ModalImageProps>}
 */
var ModalImage = function ModalImage(_ref) {
  var data = _ref.data;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__modal-image__wrapper',
      'data-testid': 'modal-image',
    },
    /*#__PURE__*/ _react.default.createElement('img', {
      src: data.src,
      className: 'str-chat__modal-image__image',
    }),
  );
};

ModalImage.propTypes = {
  data: _propTypes.default.shape({
    src: _propTypes.default.string.isRequired,
  }).isRequired,
};
var _default = ModalImage;
exports.default = _default;
