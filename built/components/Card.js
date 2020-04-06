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
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var SafeAnchor_1 = require('./SafeAnchor');
var Poweredby_100px_White_VertText_png_1 = __importDefault(
  require('../assets/Poweredby_100px-White_VertText.png'),
);
var context_1 = require('../context');
/**
 * Card - Simple Card Layout
 *
 * @example ./docs/Card.md
 * @extends PureComponent
 */
var Card = /** @class */ (function(_super) {
  __extends(Card, _super);
  function Card() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.trimUrl = function(url) {
      var trimmedUrl;
      if (url !== undefined && url !== null) {
        trimmedUrl = url
          .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
          .split('/')[0];
      }
      return trimmedUrl;
    };
    return _this;
  }
  Card.prototype.render = function() {
    var _a = this.props,
      title = _a.title,
      title_link = _a.title_link,
      text = _a.text,
      type = _a.type,
      image_url = _a.image_url,
      thumb_url = _a.thumb_url,
      og_scrape_url = _a.og_scrape_url,
      t = _a.t;
    var image = thumb_url || image_url;
    if (!title && !title_link && !image) {
      return react_1.default.createElement(
        'div',
        {
          className:
            'str-chat__message-attachment-card str-chat__message-attachment-card--' +
            type,
        },
        react_1.default.createElement(
          'div',
          { className: 'str-chat__message-attachment-card--content' },
          react_1.default.createElement(
            'div',
            { className: 'str-chat__message-attachment-card--text' },
            t('this content could not be displayed'),
          ),
        ),
      );
    }
    if (!title_link && !og_scrape_url) {
      return null;
    }
    return react_1.default.createElement(
      'div',
      {
        className:
          'str-chat__message-attachment-card str-chat__message-attachment-card--' +
          type,
      },
      image &&
        react_1.default.createElement(
          'div',
          { className: 'str-chat__message-attachment-card--header' },
          react_1.default.createElement('img', { src: image, alt: image }),
        ),
      react_1.default.createElement(
        'div',
        { className: 'str-chat__message-attachment-card--content' },
        react_1.default.createElement(
          'div',
          { className: 'str-chat__message-attachment-card--flex' },
          title &&
            react_1.default.createElement(
              'div',
              { className: 'str-chat__message-attachment-card--title' },
              title,
            ),
          text &&
            react_1.default.createElement(
              'div',
              { className: 'str-chat__message-attachment-card--text' },
              text,
            ),
          (title_link || og_scrape_url) &&
            react_1.default.createElement(
              SafeAnchor_1.SafeAnchor,
              {
                href: title_link || og_scrape_url,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'str-chat__message-attachment-card--url',
              },
              title_link
                ? this.trimUrl(title_link)
                : og_scrape_url
                ? this.trimUrl(og_scrape_url)
                : null,
            ),
        ),
        type === 'giphy' &&
          react_1.default.createElement('img', {
            className: 'str-chat__message-attachment-card__giphy-logo',
            src: Poweredby_100px_White_VertText_png_1.default,
            alt: 'giphy logo',
          }),
      ),
    );
  };
  Card.propTypes = {
    /** Title returned by the OG scraper */
    title: prop_types_1.default.string,
    /** Link returned by the OG scraper */
    title_link: prop_types_1.default.string,
    /** The scraped url, used as a fallback if the OG-data doesn't include a link */
    og_scrape_url: prop_types_1.default.string,
    /** The url of the full sized image */
    image_url: prop_types_1.default.string,
    /** The url for thumbnail sized image*/
    thumb_url: prop_types_1.default.string,
    /** Description returned by the OG scraper */
    text: prop_types_1.default.string,
  };
  return Card;
})(react_1.default.PureComponent);
exports.Card = Card;
exports.Card = Card = context_1.withTranslationContext(Card);
