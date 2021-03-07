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

var _FixedHeightMessage = _interopRequireDefault(
  require('../FixedHeightMessage'),
);

var _context9 = require('../../../context');

var _Avatar = require('../../Avatar');

var _MML = require('../../MML');

var _Gallery = require('../../Gallery');

var _MessageActions = require('../../MessageActions');

jest.mock('../../Avatar', function () {
  return {
    Avatar: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../MML', function () {
  return {
    MML: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../Gallery', function () {
  return {
    Gallery: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../MessageActions', function () {
  return {
    MessageActions: jest.fn(function (props) {
      return props.getMessageActions();
    }),
  };
});
var aliceProfile = {
  name: 'alice',
  image: 'alice-avatar.jpg',
};
var alice = (0, _mockBuilders.generateUser)(aliceProfile);
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});

function renderMsg(_x) {
  return _renderMsg.apply(this, arguments);
}

function _renderMsg() {
  _renderMsg = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee8(message) {
      var channel, client, customDateTimeParser;
      return _regenerator.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch ((_context8.prev = _context8.next)) {
            case 0:
              channel = (0, _mockBuilders.generateChannel)();
              _context8.next = 3;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 3:
              client = _context8.sent;
              customDateTimeParser = jest.fn(function () {
                return {
                  format: jest.fn(),
                };
              });
              return _context8.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context9.ChatContext.Provider,
                    {
                      value: {
                        theme: 'dark',
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context9.ChannelContext.Provider,
                      {
                        value: {
                          client,
                          channel,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _context9.TranslationContext.Provider,
                        {
                          value: {
                            t: function t(key) {
                              return key;
                            },
                            tDateTimeParser: customDateTimeParser,
                            userLanguage: 'en',
                          },
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _FixedHeightMessage.default,
                          {
                            message: message,
                          },
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
  return _renderMsg.apply(this, arguments);
}

describe('<FixedHeightMessage />', function () {
  afterEach(_react2.cleanup);
  beforeEach(jest.clearAllMocks);
  it(
    'should render message text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var message, _yield$renderMsg, getByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                _context.next = 3;
                return renderMsg(message);

              case 3:
                _yield$renderMsg = _context.sent;
                getByTestId = _yield$renderMsg.getByTestId;
                expect(getByTestId('msg-text')).toHaveTextContent(message.text);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should render message images',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var image, attachments, message;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                image = {
                  type: 'image',
                  image_url: 'image.jpg',
                };
                attachments = [image, image, image];
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                  attachments,
                });
                _context2.next = 5;
                return renderMsg(message);

              case 5:
                expect(_Gallery.Gallery).toHaveBeenCalledWith(
                  {
                    images: attachments,
                  },
                  {},
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
    'should render user avatar',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var message;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                _context3.next = 3;
                return renderMsg(message);

              case 3:
                expect(_Avatar.Avatar).toHaveBeenCalledWith(
                  expect.objectContaining(aliceProfile),
                  {},
                );

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should render MML',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var mml, message;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                mml = '<mml>text</mml>';
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                  mml,
                });
                _context4.next = 4;
                return renderMsg(message);

              case 4:
                expect(_MML.MML).toHaveBeenCalledWith(
                  expect.objectContaining({
                    source: mml,
                    align: 'left',
                  }),
                  {},
                );

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
    'should render message action for owner',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var message;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                _context5.next = 3;
                return renderMsg(message);

              case 3:
                expect(_MessageActions.MessageActions).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message,
                  }),
                  {},
                );
                expect(_MessageActions.MessageActions).toHaveReturnedWith([
                  'delete',
                ]);

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should not render message action for others',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context6.next = 3;
                return renderMsg(message);

              case 3:
                expect(_MessageActions.MessageActions).toHaveReturnedWith([]);

              case 4:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should display text in users set language',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var message, _yield$renderMsg2, getByText;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                  i18n: {
                    fr_text: 'bonjour',
                    en_text: 'hello',
                    language: 'fr',
                  },
                  text: 'bonjour',
                });
                _context7.next = 3;
                return renderMsg(message);

              case 3:
                _yield$renderMsg2 = _context7.sent;
                getByText = _yield$renderMsg2.getByText;
                expect(getByText('hello')).toBeInTheDocument();

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
});
