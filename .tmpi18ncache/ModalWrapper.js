'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _reactImages = _interopRequireWildcard(require('react-images'));

var _ModalImage = _interopRequireDefault(require('./ModalImage'));

// @ts-check

/**
 * ImageModal - Small modal component
 * @type { React.FC<import('types').ModalWrapperProps>}
 */
var ModalComponent = function ModalComponent(_ref) {
  var images = _ref.images,
    toggleModal = _ref.toggleModal,
    index = _ref.index,
    modalIsOpen = _ref.modalIsOpen;
  return /*#__PURE__*/ _react.default.createElement(
    _reactImages.ModalGateway,
    null,
    modalIsOpen
      ? /*#__PURE__*/
        // @ts-expect-error
        _react.default.createElement(
          _reactImages.Modal,
          {
            onClose: toggleModal,
          },
          /*#__PURE__*/ _react.default.createElement(_reactImages.default, {
            views: images,
            currentIndex: index,
            components: {
              // @ts-expect-error
              View: _ModalImage.default,
            },
          }),
        )
      : null,
  );
};

ModalComponent.propTypes = {
  images: _propTypes.default.array.isRequired,
  toggleModal: _propTypes.default.func.isRequired,
  index: _propTypes.default.number,
  modalIsOpen: _propTypes.default.bool.isRequired,
};
var _default = ModalComponent;
exports.default = _default;
