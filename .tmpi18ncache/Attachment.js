'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.renderMedia = exports.renderAudio = exports.renderFile = exports.renderCard = exports.renderImage = exports.renderGallery = exports.renderAttachmentActions = exports.renderAttachmentWithinContainer = exports.isFileAttachment = exports.isAudioAttachment = exports.isMediaAttachment = exports.isImageAttachment = exports.isGalleryAttachment = exports.SUPPORTED_VIDEO_FORMATS = void 0;

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _objectWithoutProperties2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectWithoutProperties'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _reactPlayer = _interopRequireDefault(require('react-player'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _AttachmentActions = _interopRequireDefault(require('./AttachmentActions'));

var _Audio = _interopRequireDefault(require('./Audio'));

var _Card = _interopRequireDefault(require('./Card'));

var _FileAttachment = _interopRequireDefault(require('./FileAttachment'));

var _Gallery = require('../Gallery');

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

var SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/ogg',
  'video/webm',
  'video/quicktime',
];
/**
 * @typedef {import('types').ExtendedAttachment} ExtendedAttachment
 * @typedef {Required<Pick<import('types').InnerAttachmentUIComponentProps, 'Card' | 'File' | 'Gallery' |'Image' | 'Audio' | 'Media' | 'AttachmentActions'>>} DefaultProps
 * @typedef {Omit<import('types').InnerAttachmentUIComponentProps, 'Card' | 'File' | 'Image'| 'Gallery' | 'Audio' | 'Media' | 'AttachmentActions'> & DefaultProps} AttachmentProps
 */

/**
 * @param {ExtendedAttachment} a
 */

exports.SUPPORTED_VIDEO_FORMATS = SUPPORTED_VIDEO_FORMATS;

var isGalleryAttachment = function isGalleryAttachment(a) {
  return a.type === 'gallery';
};
/**
 * @param {ExtendedAttachment} a
 */

exports.isGalleryAttachment = isGalleryAttachment;

var isImageAttachment = function isImageAttachment(a) {
  return a.type === 'image' && !a.title_link && !a.og_scrape_url;
};
/**
 * @param {ExtendedAttachment} a
 */

exports.isImageAttachment = isImageAttachment;

var isMediaAttachment = function isMediaAttachment(a) {
  return (
    (a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) !== -1) ||
    a.type === 'video'
  );
};
/**
 * @param {ExtendedAttachment} a
 */

exports.isMediaAttachment = isMediaAttachment;

var isAudioAttachment = function isAudioAttachment(a) {
  return a.type === 'audio';
};
/**
 * @param {ExtendedAttachment} a
 */

exports.isAudioAttachment = isAudioAttachment;

var isFileAttachment = function isFileAttachment(a) {
  return (
    a.type === 'file' ||
    (a.mime_type &&
      SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) === -1 &&
      a.type !== 'video')
  );
};
/**
 * @param {React.ReactNode} children
 * @param {ExtendedAttachment} attachment
 * @param {string} componentType
 */

exports.isFileAttachment = isFileAttachment;

var renderAttachmentWithinContainer = function renderAttachmentWithinContainer(
  children,
  attachment,
  componentType,
) {
  var extra =
    attachment && attachment.actions && attachment.actions.length
      ? 'actions'
      : '';

  if (
    componentType === 'card' &&
    !attachment.image_url &&
    !attachment.thumb_url
  ) {
    extra = 'no-image';
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__message-attachment str-chat__message-attachment--'
        .concat(componentType, ' str-chat__message-attachment--')
        .concat(attachment.type, ' str-chat__message-attachment--')
        .concat(componentType, '--')
        .concat(extra),
      key: ''
        .concat(
          attachment === null || attachment === void 0 ? void 0 : attachment.id,
          '-',
        )
        .concat(attachment.type || 'none', ' '),
    },
    children,
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderAttachmentWithinContainer = renderAttachmentWithinContainer;

var renderAttachmentActions = function renderAttachmentActions(props) {
  var a = props.attachment,
    AttachmentActions = props.AttachmentActions,
    actionHandler = props.actionHandler;

  if (!a.actions || !a.actions.length) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    AttachmentActions,
    (0, _extends2.default)({}, a, {
      id: a.id || '',
      actions: a.actions || [],
      text: a.text || '',
      key: 'key-actions-'.concat(a.id),
      actionHandler: actionHandler,
    }),
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderAttachmentActions = renderAttachmentActions;

var renderGallery = function renderGallery(props) {
  var a = props.attachment,
    Gallery = props.Gallery;
  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(Gallery, {
      images: a.images || [],
      key: 'gallery',
    }),
    a,
    'gallery',
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderGallery = renderGallery;

var renderImage = function renderImage(props) {
  var a = props.attachment,
    Image = props.Image;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__attachment',
          key: 'key-image-'.concat(a.id),
        },
        /*#__PURE__*/ _react.default.createElement(Image, a),
        renderAttachmentActions(props),
      ),
      a,
      'image',
    );
  }

  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(
      Image,
      (0, _extends2.default)({}, a, {
        key: 'key-image-'.concat(a.id),
      }),
    ),
    a,
    'image',
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderImage = renderImage;

var renderCard = function renderCard(props) {
  var a = props.attachment,
    Card = props.Card;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__attachment',
          key: 'key-image-'.concat(a.id),
        },
        /*#__PURE__*/ _react.default.createElement(
          Card,
          (0, _extends2.default)({}, a, {
            key: 'key-card-'.concat(a.id),
          }),
        ),
        renderAttachmentActions(props),
      ),
      a,
      'card',
    );
  }

  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(
      Card,
      (0, _extends2.default)({}, a, {
        key: 'key-card-'.concat(a.id),
      }),
    ),
    a,
    'card',
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderCard = renderCard;

var renderFile = function renderFile(props) {
  var a = props.attachment,
    File = props.File;
  if (!a.asset_url) return null;
  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(File, {
      attachment: a,
      key: 'key-file-'.concat(a.id),
    }),
    a,
    'file',
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderFile = renderFile;

var renderAudio = function renderAudio(props) {
  var a = props.attachment,
    Audio = props.Audio;
  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__attachment',
        key: 'key-video-'.concat(a.id),
      },
      /*#__PURE__*/ _react.default.createElement(Audio, {
        og: a,
      }),
    ),
    a,
    'audio',
  );
};
/**
 * @param {AttachmentProps} props
 */

exports.renderAudio = renderAudio;

var renderMedia = function renderMedia(props) {
  var a = props.attachment,
    Media = props.Media;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer(
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__attachment str-chat__attachment-media',
          key: 'key-video-'.concat(a.id),
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__player-wrapper',
          },
          /*#__PURE__*/ _react.default.createElement(Media, {
            className: 'react-player',
            url: a.asset_url,
            width: '100%',
            height: '100%',
            controls: true,
          }),
        ),
        renderAttachmentActions(props),
      ),
      a,
      'media',
    );
  }

  return renderAttachmentWithinContainer(
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__player-wrapper',
        key: 'key-video-'.concat(a.id),
      },
      /*#__PURE__*/ _react.default.createElement(Media, {
        className: 'react-player',
        url: a.asset_url,
        width: '100%',
        height: '100%',
        controls: true,
      }),
    ),
    a,
    'media',
  );
};
/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 * @type { React.FC<import('types').WrapperAttachmentUIComponentProps> }
 */

exports.renderMedia = renderMedia;

var Attachment = function Attachment(_ref) {
  var _gallery$images, _newAttachments;

  var attachments = _ref.attachments,
    _ref$Card = _ref.Card,
    Card = _ref$Card === void 0 ? _Card.default : _ref$Card,
    _ref$Image = _ref.Image,
    Image = _ref$Image === void 0 ? _Gallery.ImageComponent : _ref$Image,
    _ref$Gallery = _ref.Gallery,
    Gallery = _ref$Gallery === void 0 ? _Gallery.Gallery : _ref$Gallery,
    _ref$Audio = _ref.Audio,
    Audio = _ref$Audio === void 0 ? _Audio.default : _ref$Audio,
    _ref$File = _ref.File,
    File = _ref$File === void 0 ? _FileAttachment.default : _ref$File,
    _ref$Media = _ref.Media,
    Media = _ref$Media === void 0 ? _reactPlayer.default : _ref$Media,
    _ref$AttachmentAction = _ref.AttachmentActions,
    AttachmentActions =
      _ref$AttachmentAction === void 0
        ? _AttachmentActions.default
        : _ref$AttachmentAction,
    rest = (0, _objectWithoutProperties2.default)(_ref, [
      'attachments',
      'Card',
      'Image',
      'Gallery',
      'Audio',
      'File',
      'Media',
      'AttachmentActions',
    ]);
  var gallery = {
    type: 'gallery',
    images: attachments.filter(
      /** @param {import('types').ExtendedAttachment} a */
      function (a) {
        return a.type === 'image' && !(a.og_scrape_url || a.title_link);
      },
    ),
  };
  var newAttachments;

  if (
    ((_gallery$images = gallery.images) === null || _gallery$images === void 0
      ? void 0
      : _gallery$images.length) >= 2
  ) {
    newAttachments = [].concat(
      (0, _toConsumableArray2.default)(
        attachments.filter(
          /** @param {import('types').ExtendedAttachment} a */
          function (a) {
            return !(a.type === 'image' && !(a.og_scrape_url || a.title_link));
          },
        ),
      ),
      [gallery],
    );
  } else {
    newAttachments = attachments;
  }

  var propsWithDefault = _objectSpread(
    {
      Card,
      Image,
      Audio,
      File,
      Media,
      Gallery,
      AttachmentActions,
      attachments: newAttachments,
    },
    rest,
  );

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    (_newAttachments = newAttachments) === null || _newAttachments === void 0
      ? void 0
      : _newAttachments.map(
          /** @param {any} attachment */
          function (attachment) {
            if (isGalleryAttachment(attachment)) {
              return renderGallery(
                _objectSpread(
                  _objectSpread({}, propsWithDefault),
                  {},
                  {
                    attachment,
                  },
                ),
              );
            }

            if (isImageAttachment(attachment)) {
              return renderImage(
                _objectSpread(
                  _objectSpread({}, propsWithDefault),
                  {},
                  {
                    attachment,
                  },
                ),
              );
            }

            if (isFileAttachment(attachment)) {
              return renderFile(
                _objectSpread(
                  _objectSpread({}, propsWithDefault),
                  {},
                  {
                    attachment,
                  },
                ),
              );
            }

            if (isAudioAttachment(attachment)) {
              return renderAudio(
                _objectSpread(
                  _objectSpread({}, propsWithDefault),
                  {},
                  {
                    attachment,
                  },
                ),
              );
            }

            if (isMediaAttachment(attachment)) {
              return renderMedia(
                _objectSpread(
                  _objectSpread({}, propsWithDefault),
                  {},
                  {
                    attachment,
                  },
                ),
              );
            }

            return renderCard(
              _objectSpread(
                _objectSpread({}, propsWithDefault),
                {},
                {
                  attachment,
                },
              ),
            );
          },
        ),
  );
};

Attachment.propTypes = {
  /**
   * The attachment to render
   * @see See [Attachment structure](https://getstream.io/chat/docs/#message_format)
   *
   *  */
  attachments:
    /** @type {PropTypes.Validator<ExtendedAttachment[]>} */
    _propTypes.default.array.isRequired,

  /**
   *
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  actionHandler: _propTypes.default.func,

  /**
   * Custom UI component for card type attachment
   * Defaults to [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.js)
   */
  Card:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').CardProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for file type attachment
   * Defaults to [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/File.js)
   */
  File:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').FileAttachmentProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.js)
   */
  Gallery:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').GalleryProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for image type attachment
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.js)
   */
  Image:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').ImageProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for audio type attachment
   * Defaults to [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.js)
   */
  Audio:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').AudioProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for media type attachment
   * Defaults to [ReactPlayer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/ReactPlayer.js)
   */
  Media:
    /** @type {PropTypes.Validator<React.ComponentType<import('react-player').ReactPlayerProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.js)
   */
  AttachmentActions:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').AttachmentActionsProps>>} */
    _propTypes.default.elementType,
};
var _default = Attachment;
exports.default = _default;
