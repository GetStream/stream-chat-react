'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _mockBuilders = require('mock-builders');

var _ChannelPreviewMessenger = _interopRequireDefault(
  require('../ChannelPreviewMessenger'),
);

describe('ChannelPreviewMessenger', function () {
  var clientUser = (0, _mockBuilders.generateUser)();
  var chatClient;
  var channel;

  var renderComponent = function renderComponent(props) {
    return /*#__PURE__*/ _react.default.createElement(
      _ChannelPreviewMessenger.default,
      (0, _extends2.default)(
        {
          channel: channel,
          latestMessage: 'This is latest message !!!',
          unread: 10,
          latestMessageLength: 6,
          displayTitle: 'Channel name',
          displayImage: 'https://randomimage.com/src.jpg',
          setActiveChannel: jest.fn(),
        },
        props,
      ),
    );
  };

  var initializeChannel = /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(c) {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                // eslint-disable-next-line react-hooks/rules-of-hooks
                (0, _mockBuilders.useMockedApis)(chatClient, [
                  (0, _mockBuilders.getOrCreateChannelApi)(c),
                ]);
                channel = chatClient.channel('messaging');
                _context.next = 4;
                return channel.watch();

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    );

    return function initializeChannel(_x) {
      return _ref.apply(this, arguments);
    };
  })();

  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)(clientUser);

              case 2:
                chatClient = _context2.sent;
                _context2.next = 5;
                return initializeChannel((0, _mockBuilders.generateChannel)());

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it('should render correctly', function () {
    var tree = _reactTestRenderer.default.create(renderComponent()).toJSON();

    expect(tree).toMatchSnapshot();
  });
  it(
    'should call setActiveChannel on click',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var setActiveChannel, _render, getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                setActiveChannel = jest.fn();
                (_render = (0, _react2.render)(
                  renderComponent({
                    setActiveChannel,
                    watchers: {},
                  }),
                )),
                  (getByTestId = _render.getByTestId);
                _context3.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(
                    getByTestId('channel-preview-button'),
                  ).toBeInTheDocument();
                });

              case 4:
                _react2.fireEvent.click(getByTestId('channel-preview-button'));

                _context3.next = 7;
                return (0, _react2.waitFor)(function () {
                  // eslint-disable-next-line jest/prefer-called-with
                  expect(setActiveChannel).toHaveBeenCalledTimes(1);
                  expect(setActiveChannel).toHaveBeenCalledWith(channel, {});
                });

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
});
