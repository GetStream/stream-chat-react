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

var _Poweredby_100pxWhite_VertText = _interopRequireDefault(
  require('../../assets/Poweredby_100px-White_VertText.png'),
);

var _context = require('../../context');

var _SafeAnchor = require('../SafeAnchor');

// @ts-check

/**
 * Card - Simple Card Layout
 *
 * @example ../../docs/Card.md
 * @typedef {import('types').CardProps} Props
 * @type React.FC<Props>
 */
var Card = function Card(_ref) {
  var title = _ref.title,
    title_link = _ref.title_link,
    og_scrape_url = _ref.og_scrape_url,
    image_url = _ref.image_url,
    thumb_url = _ref.thumb_url,
    text = _ref.text,
    type = _ref.type;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  var image = thumb_url || image_url;
  /** @type {(url?: string) => string | null} Typescript syntax */

  var trimUrl = function trimUrl(url) {
    if (url !== undefined && url !== null) {
      var _url$replace$split = url
          .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
          .split('/'),
        _url$replace$split2 = (0, _slicedToArray2.default)(
          _url$replace$split,
          1,
        ),
        trimmedUrl = _url$replace$split2[0];

      return trimmedUrl;
    }

    return null;
  };

  if (!title && !title_link && !image) {
    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__message-attachment-card str-chat__message-attachment-card--'.concat(
          type,
        ),
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-attachment-card--content',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__message-attachment-card--text',
          },
          t('this content could not be displayed'),
        ),
      ),
    );
  }

  if (!title_link && !og_scrape_url) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__message-attachment-card str-chat__message-attachment-card--'.concat(
        type,
      ),
    },
    image &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-attachment-card--header',
        },
        /*#__PURE__*/ _react.default.createElement('img', {
          src: image,
          alt: image,
        }),
      ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__message-attachment-card--content',
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-attachment-card--flex',
        },
        title &&
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__message-attachment-card--title',
            },
            title,
          ),
        text &&
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__message-attachment-card--text',
            },
            text,
          ),
        (title_link || og_scrape_url) &&
          /*#__PURE__*/ _react.default.createElement(
            _SafeAnchor.SafeAnchor,
            {
              href: title_link || og_scrape_url,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'str-chat__message-attachment-card--url',
            },
            trimUrl(title_link || og_scrape_url),
          ),
      ),
      type === 'giphy' &&
        /*#__PURE__*/ _react.default.createElement('img', {
          className: 'str-chat__message-attachment-card__giphy-logo',
          'data-testid': 'card-giphy',
          src: _Poweredby_100pxWhite_VertText.default,
          alt: 'giphy logo',
        }),
    ),
  );
};

Card.propTypes = {
  /** Title returned by the OG scraper */
  title: _propTypes.default.string,

  /** Link returned by the OG scraper */
  title_link: _propTypes.default.string,

  /** The scraped url, used as a fallback if the OG-data doesn't include a link */
  og_scrape_url: _propTypes.default.string,

  /** The url of the full sized image */
  image_url: _propTypes.default.string,

  /** The url for thumbnail sized image */
  thumb_url: _propTypes.default.string,

  /** Description returned by the OG scraper */
  text: _propTypes.default.string,
};

var _default = /*#__PURE__*/ _react.default.memo(Card);

exports.default = _default;
