'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _context = require('../../context');

var _ModalWrapper = _interopRequireDefault(require('./ModalWrapper'));

// @ts-check

/**
 * Gallery - displays up to 4 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @typedef {import('types').GalleryProps} Props
 * @type React.FC<Props>
 */
var Gallery = function Gallery(_ref) {
  var images = _ref.images;

  var _useState = (0, _react.useState)(0),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    index = _useState2[0],
    setIndex = _useState2[1];

  var _useState3 = (0, _react.useState)(false),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    modalOpen = _useState4[0],
    setModalOpen = _useState4[1];

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;
  /**
   * @param {number} selectedIndex Index of image clicked
   */

  var toggleModal = function toggleModal(selectedIndex) {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  var formattedArray = (0, _react.useMemo)(
    function () {
      return images.map(function (image) {
        return {
          src: image.image_url || image.thumb_url || '',
          source: image.image_url || image.thumb_url || '',
        };
      });
    },
    [images],
  );
  var renderImages = images.slice(0, 3).map(function (image, i) {
    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'gallery-image',
        className: 'str-chat__gallery-image',
        key: 'gallery-image-'.concat(i),
        onClick: function onClick() {
          return toggleModal(i);
        },
      },
      /*#__PURE__*/ _react.default.createElement('img', {
        src: image.image_url || image.thumb_url,
      }),
    );
  });
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__gallery '.concat(
        images.length > 3 ? 'str-chat__gallery--square' : '',
      ),
    },
    renderImages,
    images.length > 3 &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__gallery-placeholder',
          style: {
            backgroundImage: 'url('.concat(images[3].image_url, ')'),
          },
          onClick: function onClick() {
            return toggleModal(3);
          },
        },
        /*#__PURE__*/ _react.default.createElement(
          'p',
          null,
          t('{{ imageCount }} more', {
            imageCount: images.length - 3,
          }),
        ),
      ),
    /*#__PURE__*/ _react.default.createElement(_ModalWrapper.default, {
      images: formattedArray,
      index: index, // @ts-expect-error
      toggleModal: toggleModal,
      modalIsOpen: modalOpen,
    }),
  );
};

Gallery.propTypes = {
  images:
    /** @type { PropTypes.Validator<import('types').GalleryProps['images']> } */
    _propTypes.default.arrayOf(_propTypes.default.object.isRequired).isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(Gallery);

exports.default = _default;
