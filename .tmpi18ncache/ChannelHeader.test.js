'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _ChannelHeader = _interopRequireDefault(require('../ChannelHeader'));

var _context9 = require('../../../context');

var alice = (0, _mockBuilders.generateUser)();
var testChannel1;

function renderComponent(_x, _x2) {
  return _renderComponent.apply(this, arguments);
}

function _renderComponent() {
  _renderComponent = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee8(
      props,
      channelData,
    ) {
      var t, client;
      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch ((_context8.prev = _context8.next)) {
            case 0:
              testChannel1 = (0, _mockBuilders.generateChannel)(channelData);
              t = jest.fn(function (key) {
                return key;
              });
              _context8.next = 4;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 4:
              client = _context8.sent;
              return _context8.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context9.ChatContext.Provider,
                    {
                      value: {
                        client,
                        channel: testChannel1,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context9.ChannelContext.Provider,
                      {
                        value: {
                          client,
                          channel: testChannel1,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _context9.TranslationContext.Provider,
                        {
                          value: {
                            t,
                          },
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelHeader.default,
                          props,
                        ),
                      ),
                    ),
                  ),
                ),
              );

            case 6:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8);
    }),
  );
  return _renderComponent.apply(this, arguments);
}

afterEach(_react2.cleanup); // eslint-disable-line

describe('ChannelHeader', function () {
  it(
    'should display live label when prop live is true',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _yield$renderComponen, container;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderComponent(
                  {
                    live: true,
                  },
                  {
                    data: {
                      image: 'image.jpg',
                      name: 'test-channel-1',
                    },
                  },
                );

              case 2:
                _yield$renderComponen = _context.sent;
                container = _yield$renderComponen.container;
                expect(
                  container.querySelector(
                    '.str-chat__header-livestream-left--livelabel',
                  ),
                ).toBeInTheDocument();

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should display avatar when channel has an image',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _yield$renderComponen2, getByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return renderComponent(
                  {
                    live: false,
                  },
                  {
                    data: {
                      image: 'image.jpg',
                      name: 'test-channel-1',
                    },
                  },
                );

              case 2:
                _yield$renderComponen2 = _context2.sent;
                getByTestId = _yield$renderComponen2.getByTestId;
                expect(getByTestId('avatar-img')).toBeInTheDocument();
                expect(getByTestId('avatar-img')).toHaveAttribute(
                  'src',
                  'image.jpg',
                );

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should display custom title',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var _yield$renderComponen3, getByText;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.next = 2;
                return renderComponent(
                  {
                    title: 'Custom Title',
                  },
                  {
                    data: {
                      image: 'image.jpg',
                      name: 'test-channel-1',
                    },
                  },
                );

              case 2:
                _yield$renderComponen3 = _context3.sent;
                getByText = _yield$renderComponen3.getByText;
                expect(getByText('Custom Title')).toBeInTheDocument();

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should display subtitle if present in channel data',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var _yield$renderComponen4, getByText;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                _context4.next = 2;
                return renderComponent(null, {
                  data: {
                    image: 'image.jpg',
                    name: 'test-channel-1',
                    subtitle: 'test subtitle',
                  },
                });

              case 2:
                _yield$renderComponen4 = _context4.sent;
                getByText = _yield$renderComponen4.getByText;
                expect(getByText('test subtitle')).toBeInTheDocument();

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should display bigger image if channelType is commerce',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var _yield$renderComponen5, getByTestId;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                _context5.next = 2;
                return renderComponent(null, {
                  type: 'commerce',
                  data: {
                    image: 'image.jpg',
                    name: 'test-channel-1',
                    subtitle: 'test subtitle',
                  },
                });

              case 2:
                _yield$renderComponen5 = _context5.sent;
                getByTestId = _yield$renderComponen5.getByTestId;
                expect(getByTestId('avatar-img')).toHaveStyle({
                  width: '60px',
                  height: '60px',
                  flexBasis: '60px',
                  objectFit: 'cover',
                });
                expect(getByTestId('avatar')).toHaveStyle({
                  width: '60px',
                  height: '60px',
                  flexBasis: '60px',
                  lineHeight: '60px',
                  fontSize: 30,
                });
                expect(getByTestId('avatar')).toHaveClass(
                  'str-chat__avatar str-chat__avatar--rounded',
                );

              case 7:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should display watcher_count',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var _yield$renderComponen6, getByText;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                _context6.next = 2;
                return renderComponent(null, {
                  data: {
                    image: 'image.jpg',
                    name: 'test-channel-1',
                    subtitle: 'test subtitle',
                    watcher_count: 34,
                  },
                });

              case 2:
                _yield$renderComponen6 = _context6.sent;
                getByText = _yield$renderComponen6.getByText;
                (0, _react2.waitFor)(function () {
                  expect(getByText('34 online')).toBeInTheDocument();
                });

              case 5:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should display correct member_count',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var _yield$renderComponen7, getByText;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                _context7.next = 2;
                return renderComponent(null, {
                  data: {
                    image: 'image.jpg',
                    name: 'test-channel-1',
                    subtitle: 'test subtitle',
                    member_count: 34,
                  },
                });

              case 2:
                _yield$renderComponen7 = _context7.sent;
                getByText = _yield$renderComponen7.getByText;
                (0, _react2.waitFor)(function () {
                  expect(getByText('34 members')).toBeInTheDocument();
                });

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
});
