'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _EventComponent = _interopRequireDefault(require('../EventComponent'));

jest.mock('../../Avatar', function () {
  return {
    Avatar: jest.fn(function (_ref) {
      var _ref$image = _ref.image,
        image = _ref$image === void 0 ? '' : _ref$image,
        _ref$name = _ref.name,
        name = _ref$name === void 0 ? '' : _ref$name;
      return /*#__PURE__*/ _react.default.createElement('img', {
        'data-testid': 'avatar',
        src: image,
        name: name,
      });
    }),
  };
});
describe('EventComponent', function () {
  afterEach(_react2.cleanup);
  it('should render null for empty message', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_EventComponent.default, {
          message: {},
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot('null');
  });
  it('should render system events', function () {
    var message = {
      type: 'system',
      text: 'system event',
      created_at: '2020-03-13T10:18:38.148025Z',
    };

    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_EventComponent.default, {
          message: message,
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message--system"\n      >\n        <div\n          className="str-chat__message--system__text"\n        >\n          <div\n            className="str-chat__message--system__line"\n          />\n          <p>\n            system event\n          </p>\n          <div\n            className="str-chat__message--system__line"\n          />\n        </div>\n        <div\n          className="str-chat__message--system__date"\n        >\n          <strong>\n            Friday\n             \n          </strong>\n          at \n          10:18 AM\n        </div>\n      </div>\n    ',
    );
  });
  describe('Channel events', function () {
    it('should render message for member add event', function () {
      var message = {
        type: 'channel.event',
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.added',
          user: {
            id: 'user_id',
            username: 'username',
            image: 'image_url',
          },
        },
      };

      var tree = _reactTestRenderer.default
        .create(
          /*#__PURE__*/ _react.default.createElement(_EventComponent.default, {
            message: message,
          }),
        )
        .toJSON();

      expect(tree).toMatchInlineSnapshot(
        '\n        <div\n          className="str-chat__event-component__channel-event"\n        >\n          <img\n            data-testid="avatar"\n            name="user_id"\n            src="image_url"\n          />\n          <div\n            className="str-chat__event-component__channel-event__content"\n          >\n            <em\n              className="str-chat__event-component__channel-event__sentence"\n            >\n              user_id has joined the chat\n            </em>\n            <div\n              className="str-chat__event-component__channel-event__date"\n            >\n              6:18 PM\n            </div>\n          </div>\n        </div>\n      ',
      );
    });
    it('should render message for member remove event', function () {
      var message = {
        type: 'channel.event',
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.removed',
          user: {
            id: 'user_id',
            username: 'username',
            image: 'image_url',
          },
        },
      };

      var tree = _reactTestRenderer.default
        .create(
          /*#__PURE__*/ _react.default.createElement(_EventComponent.default, {
            message: message,
          }),
        )
        .toJSON();

      expect(tree).toMatchInlineSnapshot(
        '\n        <div\n          className="str-chat__event-component__channel-event"\n        >\n          <img\n            data-testid="avatar"\n            name="user_id"\n            src="image_url"\n          />\n          <div\n            className="str-chat__event-component__channel-event__content"\n          >\n            <em\n              className="str-chat__event-component__channel-event__sentence"\n            >\n              user_id was removed from the chat\n            </em>\n            <div\n              className="str-chat__event-component__channel-event__date"\n            >\n              6:18 PM\n            </div>\n          </div>\n        </div>\n      ',
      );
    });
  });
});
