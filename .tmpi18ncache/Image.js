'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck'),
);

var _createClass2 = _interopRequireDefault(
  require('@babel/runtime/helpers/createClass'),
);

var _assertThisInitialized2 = _interopRequireDefault(
  require('@babel/runtime/helpers/assertThisInitialized'),
);

var _inherits2 = _interopRequireDefault(
  require('@babel/runtime/helpers/inherits'),
);

var _possibleConstructorReturn2 = _interopRequireDefault(
  require('@babel/runtime/helpers/possibleConstructorReturn'),
);

var _getPrototypeOf2 = _interopRequireDefault(
  require('@babel/runtime/helpers/getPrototypeOf'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _ModalWrapper = _interopRequireDefault(require('./ModalWrapper'));

var _sanitizeUrl = require('@braintree/sanitize-url');

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = (0, _getPrototypeOf2.default)(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = (0, _getPrototypeOf2.default)(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return (0, _possibleConstructorReturn2.default)(this, result);
  };
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === 'undefined' || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === 'function') return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ../../docs/Image.md
 * @extends {React.PureComponent<import('type').ImageProps>}
 */
var ImageComponent = /*#__PURE__*/ (function (_React$PureComponent) {
  (0, _inherits2.default)(ImageComponent, _React$PureComponent);

  var _super = _createSuper(ImageComponent);

  function ImageComponent() {
    var _this;

    (0, _classCallCheck2.default)(this, ImageComponent);

    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'state',
      {
        modalIsOpen: false,
        currentIndex: 0,
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'toggleModal',
      function () {
        _this.setState(function (state) {
          return {
            modalIsOpen: !state.modalIsOpen,
          };
        });
      },
    );
    return _this;
  }

  (0, _createClass2.default)(ImageComponent, [
    {
      key: 'render',
      value: function render() {
        var _this$props = this.props,
          image_url = _this$props.image_url,
          thumb_url = _this$props.thumb_url,
          fallback = _this$props.fallback;
        var imageSrc = (0, _sanitizeUrl.sanitizeUrl)(image_url || thumb_url);
        var formattedArray = [
          {
            src: imageSrc,
          },
        ];
        return /*#__PURE__*/ _react.default.createElement(
          _react.default.Fragment,
          null,
          /*#__PURE__*/ _react.default.createElement('img', {
            className: 'str-chat__message-attachment--img',
            onClick: this.toggleModal,
            src: imageSrc,
            alt: fallback,
            'data-testid': 'image-test',
          }),
          /*#__PURE__*/ _react.default.createElement(_ModalWrapper.default, {
            images: formattedArray,
            toggleModal: this.toggleModal,
            index: this.state.currentIndex,
            modalIsOpen: this.state.modalIsOpen,
          }),
        );
      },
    },
  ]);
  return ImageComponent;
})(_react.default.PureComponent);

(0, _defineProperty2.default)(ImageComponent, 'propTypes', {
  /** The full size image url */
  image_url: _propTypes.default.string,

  /** The thumb url */
  thumb_url: _propTypes.default.string,

  /** The text fallback for the image */
  fallback: _propTypes.default.string,
});
var _default = ImageComponent;
exports.default = _default;
