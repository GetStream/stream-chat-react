'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _Card = _interopRequireDefault(require('../Card'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('Card', function () {
  it('should render Card with default props', function () {
    var tree = _reactTestRenderer.default
      .create(/*#__PURE__*/ _react.default.createElement(_Card.default, null))
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"\n      >\n        <div\n          className="str-chat__message-attachment-card--content"\n        >\n          <div\n            className="str-chat__message-attachment-card--text"\n          >\n            this content could not be displayed\n          </div>\n        </div>\n      </div>\n    ',
    );
  });
  it('should render Card with default props and image_url', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          image_url: 'test.jpg',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot('null');
  });
  it('should render Card with default props and title', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot('null');
  });
  it('should render Card with default props and og_scrape_url', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          og_scrape_url: 'https://google.com',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"\n      >\n        <div\n          className="str-chat__message-attachment-card--content"\n        >\n          <div\n            className="str-chat__message-attachment-card--text"\n          >\n            this content could not be displayed\n          </div>\n        </div>\n      </div>\n    ',
    );
  });
  it('should render Card with default props and title and og_scrape_url', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
          og_scrape_url: 'https://google.com',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"\n      >\n        <div\n          className="str-chat__message-attachment-card--content"\n        >\n          <div\n            className="str-chat__message-attachment-card--flex"\n          >\n            <div\n              className="str-chat__message-attachment-card--title"\n            >\n              test\n            </div>\n            <a\n              className="str-chat__message-attachment-card--url"\n              href="https://google.com"\n              target="_blank"\n            >\n              google.com\n            </a>\n          </div>\n        </div>\n      </div>\n    ',
    );
  });
  it('should render Card with default props and title, title, og_scrape_url, image_url', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
          og_scrape_url: 'https://google.com',
          image_url: 'test.jpg',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"\n      >\n        <div\n          className="str-chat__message-attachment-card--header"\n        >\n          <img\n            alt="test.jpg"\n            src="test.jpg"\n          />\n        </div>\n        <div\n          className="str-chat__message-attachment-card--content"\n        >\n          <div\n            className="str-chat__message-attachment-card--flex"\n          >\n            <div\n              className="str-chat__message-attachment-card--title"\n            >\n              test\n            </div>\n            <a\n              className="str-chat__message-attachment-card--url"\n              href="https://google.com"\n              target="_blank"\n            >\n              google.com\n            </a>\n          </div>\n        </div>\n      </div>\n    ',
    );
  });
  it('should render Card with default props and title, title, og_scrape_url, image_url, text', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
          og_scrape_url: 'https://google.com',
          image_url: 'test.jpg',
          text: 'test text',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-attachment-card str-chat__message-attachment-card--undefined"\n      >\n        <div\n          className="str-chat__message-attachment-card--header"\n        >\n          <img\n            alt="test.jpg"\n            src="test.jpg"\n          />\n        </div>\n        <div\n          className="str-chat__message-attachment-card--content"\n        >\n          <div\n            className="str-chat__message-attachment-card--flex"\n          >\n            <div\n              className="str-chat__message-attachment-card--title"\n            >\n              test\n            </div>\n            <div\n              className="str-chat__message-attachment-card--text"\n            >\n              test text\n            </div>\n            <a\n              className="str-chat__message-attachment-card--url"\n              href="https://google.com"\n              target="_blank"\n            >\n              google.com\n            </a>\n          </div>\n        </div>\n      </div>\n    ',
    );
  });
  it('should render giphy logo when type is giphy', function () {
    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
          og_scrape_url: 'https://google.com',
          type: 'giphy',
        }),
      ),
      getByTestId = _render.getByTestId;

    expect(getByTestId('card-giphy')).toBeInTheDocument();
  });
  it('should render trimmed url', function () {
    var _render2 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test',
          og_scrape_url:
            'https://www.theverge.com/2020/6/15/21291288/sony-ps5-software-user-interface-ui-design-dashboard-teaser-video',
        }),
      ),
      getByText = _render2.getByText;

    expect(getByText('theverge.com')).toBeInTheDocument();
  });
  it('should return null if no og_scrape_url && no title_link', function () {
    var _render3 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Card.default, {
          title: 'test card',
        }),
      ),
      container = _render3.container;

    expect(container).toBeEmptyDOMElement();
  });
});
