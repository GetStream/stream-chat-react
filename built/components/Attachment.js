'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var react_player_1 = __importDefault(require('react-player'));
var Card_1 = require('./Card');
var Image_1 = require('./Image');
var AttachmentActions_1 = require('./AttachmentActions');
var react_file_utils_1 = require('react-file-utils');
var pretty_bytes_1 = __importDefault(require('pretty-bytes'));
var prop_types_1 = __importDefault(require('prop-types'));
var SafeAnchor_1 = require('./SafeAnchor');
var Audio_1 = require('./Audio');
/**
 * Attachment - The message attachment
 *
 * @example ./docs/Attachment.md
 * @extends PureComponent
 */
var Attachment = /** @class */ (function(_super) {
  __extends(Attachment, _super);
  function Attachment() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.attachmentRef = react_1.default.createRef();
    _this.renderAttachmentActions = function(a) {
      return react_1.default.createElement(
        AttachmentActions_1.AttachmentActions,
        __assign({ key: 'key-actions-' + a.id }, a, {
          actionHandler: _this.props.actionHandler,
        }),
      );
    };
    _this.renderAttachment = function(a) {
      return react_1.default.createElement(
        'div',
        { className: 'str-chat__attachment', key: 'key-image-' + a.id },
        react_1.default.createElement(
          Card_1.Card,
          __assign({}, a, { key: 'key-card-' + a.id }),
        ),
        _this.renderAttachmentActions(a),
      );
    };
    return _this;
  }
  Attachment.prototype.attachmentType = function(a) {
    var type, extra;
    if (a.actions && a.actions.length > 0) {
      extra = 'actions';
    }
    if (a.type === 'giphy' || a.type === 'imgur') {
      type = 'card';
    } else if (a.type === 'image' && (a.title_link || a.og_scrape_url)) {
      type = 'card';
    } else if (a.type === 'image') {
      type = 'image';
    } else if (a.type === 'file') {
      type = 'file';
    } else if (a.type === 'audio') {
      type = 'audio';
    } else if (a.type === 'video') {
      type = 'media';
    } else {
      type = 'card';
      extra = 'no-image';
    }
    return { type: type, extra: extra };
  };
  Attachment.prototype.render = function() {
    var a = this.props.attachment;
    if (!a) {
      return null;
    }
    var _a = this.attachmentType(a),
      type = _a.type,
      extra = _a.extra;
    if (type === 'card' && !a.title_link && !a.og_scrape_url) {
      return null;
    }
    var results = [];
    if (type === 'image') {
      if (a.actions && a.actions.length) {
        results.push(
          react_1.default.createElement(
            'div',
            { className: 'str-chat__attachment', key: 'key-image-' + a.id },
            react_1.default.createElement(Image_1.Image, __assign({}, a)),
            this.renderAttachmentActions(a),
          ),
        );
      } else {
        results.push(
          react_1.default.createElement(
            Image_1.Image,
            __assign({}, a, { key: 'key-image-' + a.id }),
          ),
        );
      }
    } else if (type === 'file') {
      a.asset_url &&
        results.push(
          react_1.default.createElement(
            'div',
            {
              className: 'str-chat__message-attachment-file--item',
              key: 'key-file-' + a.id,
            },
            react_1.default.createElement(react_file_utils_1.FileIcon, {
              mimeType: a.mime_type,
              filename: a.title,
              big: true,
              size: 30,
            }),
            react_1.default.createElement(
              'div',
              { className: 'str-chat__message-attachment-file--item-text' },
              react_1.default.createElement(
                SafeAnchor_1.SafeAnchor,
                { href: a.asset_url, target: '_blank', download: true },
                a.title,
              ),
              a.file_size &&
                react_1.default.createElement(
                  'span',
                  null,
                  pretty_bytes_1.default(a.file_size),
                ),
            ),
          ),
        );
    } else if (type === 'audio') {
      results.push(
        react_1.default.createElement(
          'div',
          { className: 'str-chat__attachment', key: 'key-video-' + a.id },
          react_1.default.createElement(Audio_1.Audio, { og: a }),
        ),
      );
    } else if (type === 'media') {
      if (a.actions && a.actions.length) {
        results.push(
          react_1.default.createElement(
            'div',
            { className: 'str-chat__attachment', key: 'key-video-' + a.id },
            react_1.default.createElement(
              'div',
              { className: 'str-chat__player-wrapper' },
              react_1.default.createElement(react_player_1.default, {
                className: 'react-player',
                url: a.asset_url,
                width: '100%',
                height: '100%',
                controls: true,
              }),
            ),
            this.renderAttachmentActions(a),
          ),
        );
      } else {
        results.push(
          react_1.default.createElement(
            'div',
            { className: 'str-chat__player-wrapper', key: 'key-video-' + a.id },
            react_1.default.createElement(react_player_1.default, {
              className: 'react-player',
              url: a.asset_url,
              width: '100%',
              height: '100%',
              controls: true,
            }),
          ),
        );
      }
    } else {
      if (a.actions && a.actions.length) {
        results.push(this.renderAttachment(a));
      } else {
        results.push(
          react_1.default.createElement(
            Card_1.Card,
            __assign({}, a, { key: 'key-card-' + a.id }),
          ),
        );
      }
    }
    if (results.length === 0) return null;
    return react_1.default.createElement(
      'div',
      {
        className:
          'str-chat__message-attachment str-chat__message-attachment--' +
          type +
          ' str-chat__message-attachment--' +
          a.type +
          ' str-chat__message-attachment--' +
          type +
          '--' +
          extra,
        ref: this.attachmentRef,
      },
      results,
    );
  };
  Attachment.propTypes = {
    /**
     * The attachment to render
     * @see See [Attachment structure](https://getstream.io/chat/docs/#message_format)
     *
     *  */
    attachment: prop_types_1.default.object.isRequired,
    /**
     *
     * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
     *
     * @param name {string} Name of action
     * @param value {string} Value of action
     * @param event Dom event that triggered this handler
     */
    actionHandler: prop_types_1.default.func.isRequired,
  };
  return Attachment;
})(react_1.default.PureComponent);
exports.Attachment = Attachment;
