'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _reactFileUtils = require('react-file-utils');

var _prettyBytes = _interopRequireDefault(require('pretty-bytes'));

var _SafeAnchor = require('../SafeAnchor');

/** @type React.FC<import('types').FileAttachmentProps> */
var FileAttachment = function FileAttachment(_ref) {
  var attachment = _ref.attachment;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      'data-testid': 'attachment-file',
      className: 'str-chat__message-attachment-file--item',
    },
    /*#__PURE__*/ _react.default.createElement(_reactFileUtils.FileIcon, {
      mimeType: attachment.mime_type,
      filename: attachment.title,
      big: true,
      size: 30,
    }),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__message-attachment-file--item-text',
      },
      /*#__PURE__*/ _react.default.createElement(
        _SafeAnchor.SafeAnchor,
        {
          href: attachment.asset_url,
          target: '_blank',
          download: true,
        },
        attachment.title,
      ),
      attachment.file_size &&
        Number.isFinite(Number(attachment.file_size)) &&
        /*#__PURE__*/ _react.default.createElement(
          'span',
          null,
          (0, _prettyBytes.default)(attachment.file_size),
        ),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(FileAttachment);

exports.default = _default;
