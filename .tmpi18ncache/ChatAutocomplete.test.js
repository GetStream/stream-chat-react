'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireWildcard(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _ChatAutoComplete = _interopRequireDefault(require('../ChatAutoComplete'));

var _mockBuilders = require('../../../mock-builders');

var _Chat = require('../../Chat');

var _Channel = require('../../Channel');

var _context12 = require('../../../context');

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

var chatClient;
var channel;
var user = (0, _mockBuilders.generateUser)({
  name: 'name',
  id: 'id',
});

var ActiveChannelSetter = function ActiveChannelSetter(_ref) {
  var activeChannel = _ref.activeChannel;

  var _useContext = (0, _react.useContext)(_context12.ChatContext),
    setActiveChannel = _useContext.setActiveChannel;

  (0, _react.useEffect)(function () {
    setActiveChannel(activeChannel);
  });
  return null;
};

var renderComponent = /*#__PURE__*/ (function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee() {
      var props,
        activeChannel,
        placeholderText,
        renderResult,
        textarea,
        typeText,
        _args = arguments;
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              props =
                _args.length > 0 && _args[0] !== undefined ? _args[0] : {};
              activeChannel =
                _args.length > 1 && _args[1] !== undefined ? _args[1] : channel;
              placeholderText = props.placeholder || 'placeholder';
              renderResult = (0, _react2.render)(
                /*#__PURE__*/ _react.default.createElement(
                  _Chat.Chat,
                  {
                    client: chatClient,
                  },
                  /*#__PURE__*/ _react.default.createElement(
                    ActiveChannelSetter,
                    {
                      activeChannel: activeChannel,
                    },
                  ),
                  /*#__PURE__*/ _react.default.createElement(
                    _Channel.Channel,
                    null,
                    /*#__PURE__*/ _react.default.createElement(
                      _ChatAutoComplete.default,
                      (0, _extends2.default)({}, props, {
                        placeholder: placeholderText,
                      }),
                    ),
                  ),
                ),
              );
              _context.next = 6;
              return (0, _react2.waitFor)(function () {
                return renderResult.getByPlaceholderText(placeholderText);
              });

            case 6:
              textarea = _context.sent;

              typeText = function typeText(text) {
                _react2.fireEvent.change(textarea, {
                  target: {
                    value: text,
                    selectionEnd: text.length,
                  },
                });
              };

              return _context.abrupt(
                'return',
                _objectSpread(
                  _objectSpread({}, renderResult),
                  {},
                  {
                    typeText,
                    textarea,
                  },
                ),
              );

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee);
    }),
  );

  return function renderComponent() {
    return _ref2.apply(this, arguments);
  };
})();

describe('ChatAutoComplete', function () {
  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var messages, members, mockedChannel;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                messages = [
                  (0, _mockBuilders.generateMessage)({
                    user,
                  }),
                ];
                members = [
                  (0, _mockBuilders.generateMember)({
                    user,
                  }),
                ];
                mockedChannel = (0, _mockBuilders.generateChannel)({
                  messages,
                  members,
                });
                _context2.next = 5;
                return (0, _mockBuilders.getTestClientWithUser)(user);

              case 5:
                chatClient = _context2.sent;
                (0, _mockBuilders.useMockedApis)(chatClient, [
                  (0, _mockBuilders.getOrCreateChannelApi)(mockedChannel),
                ]);
                channel = chatClient.channel('messaging', mockedChannel.id);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  afterEach(_react2.cleanup);
  it(
    'should call onChange with the change event when you type in the input',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var onChange, _yield$renderComponen, typeText;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                onChange = jest.fn();
                _context3.next = 3;
                return renderComponent({
                  onChange,
                });

              case 3:
                _yield$renderComponen = _context3.sent;
                typeText = _yield$renderComponen.typeText;
                typeText('something');
                expect(onChange).toHaveBeenCalledWith(
                  expect.objectContaining({
                    target: expect.objectContaining({
                      value: 'something',
                    }),
                  }),
                );

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should pass the placeholder prop into the textarea',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var placeholder, _yield$renderComponen2, getByPlaceholderText;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                placeholder = 'something';
                _context4.next = 3;
                return renderComponent({
                  placeholder,
                });

              case 3:
                _yield$renderComponen2 = _context4.sent;
                getByPlaceholderText =
                  _yield$renderComponen2.getByPlaceholderText;
                expect(getByPlaceholderText(placeholder)).toBeInTheDocument();

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should pass the disabled prop to the textarea',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var _yield$renderComponen3, textarea;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                _context5.next = 2;
                return renderComponent({
                  disabled: true,
                });

              case 2:
                _yield$renderComponen3 = _context5.sent;
                textarea = _yield$renderComponen3.textarea;
                expect(textarea).toBeDisabled();

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
    'should let you select emojis when you type :<emoji>',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var emojiAutocompleteText,
          _yield$renderComponen4,
          typeText,
          findByText,
          textarea,
          emoji;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                emojiAutocompleteText = ':smile';
                _context6.next = 3;
                return renderComponent();

              case 3:
                _yield$renderComponen4 = _context6.sent;
                typeText = _yield$renderComponen4.typeText;
                findByText = _yield$renderComponen4.findByText;
                textarea = _yield$renderComponen4.textarea;
                typeText(emojiAutocompleteText);
                _context6.next = 10;
                return findByText('😄');

              case 10:
                emoji = _context6.sent;
                expect(emoji).toBeInTheDocument();

                _react2.fireEvent.click(emoji);

                expect(textarea.value).toContain('😄');

              case 14:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should let you select users when you type @<username>',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var onSelectItem,
          userAutocompleteText,
          _yield$renderComponen5,
          typeText,
          getAllByText,
          userText;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                onSelectItem = jest.fn();
                userAutocompleteText = '@'.concat(user.name);
                _context7.next = 4;
                return renderComponent({
                  onSelectItem,
                });

              case 4:
                _yield$renderComponen5 = _context7.sent;
                typeText = _yield$renderComponen5.typeText;
                getAllByText = _yield$renderComponen5.getAllByText;
                typeText(userAutocompleteText);
                _context7.next = 10;
                return getAllByText(user.name);

              case 10:
                userText = _context7.sent;
                expect(userText).toHaveLength(2);

                _react2.fireEvent.click(userText[1]);

                expect(onSelectItem).toHaveBeenCalledWith(
                  expect.objectContaining({
                    id: user.id,
                  }),
                );

              case 14:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should let you select users when you type @<userid>',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var onSelectItem,
          userAutocompleteText,
          _yield$renderComponen6,
          typeText,
          findByText,
          userText;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                onSelectItem = jest.fn();
                userAutocompleteText = '@'.concat(user.id);
                _context8.next = 4;
                return renderComponent({
                  onSelectItem,
                });

              case 4:
                _yield$renderComponen6 = _context8.sent;
                typeText = _yield$renderComponen6.typeText;
                findByText = _yield$renderComponen6.findByText;
                typeText(userAutocompleteText);
                _context8.next = 10;
                return findByText(user.name);

              case 10:
                userText = _context8.sent;
                expect(userText).toBeInTheDocument();

                _react2.fireEvent.click(userText);

                expect(onSelectItem).toHaveBeenCalledWith(
                  expect.objectContaining({
                    id: user.id,
                  }),
                );

              case 14:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should let you select commands when you type /<command>',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var commandAutocompleteText,
          _yield$renderComponen7,
          typeText,
          findByText,
          textarea,
          command;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                commandAutocompleteText = '/giph';
                _context9.next = 3;
                return renderComponent({
                  commands: [
                    {
                      name: 'giphy',
                      description: 'Post a random gif to the channel',
                      args: '[text]',
                      set: 'fun_set',
                    },
                  ],
                });

              case 3:
                _yield$renderComponen7 = _context9.sent;
                typeText = _yield$renderComponen7.typeText;
                findByText = _yield$renderComponen7.findByText;
                textarea = _yield$renderComponen7.textarea;
                typeText(commandAutocompleteText);
                _context9.next = 10;
                return findByText('giphy');

              case 10:
                command = _context9.sent;
                expect(command).toBeInTheDocument();

                _react2.fireEvent.click(command);

                expect(textarea.value).toContain('/giphy');

              case 14:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should disable mention popup list',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var onSelectItem,
          userAutocompleteText,
          _yield$renderComponen8,
          typeText,
          queryAllByText,
          userText;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                onSelectItem = jest.fn();
                userAutocompleteText = '@'.concat(user.name);
                _context10.next = 4;
                return renderComponent({
                  onSelectItem,
                  disableMentions: true,
                });

              case 4:
                _yield$renderComponen8 = _context10.sent;
                typeText = _yield$renderComponen8.typeText;
                queryAllByText = _yield$renderComponen8.queryAllByText;
                typeText(userAutocompleteText);
                _context10.next = 10;
                return queryAllByText(user.name);

              case 10:
                userText = _context10.sent;
                expect(userText).toHaveLength(0);

              case 12:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it(
    'should use the queryMembers API for mentions if a channel has many members',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var users,
          members,
          messages,
          mockedChannel,
          activeChannel,
          searchMember,
          onSelectItem,
          _yield$renderComponen9,
          typeText,
          findByText,
          mentionedUser,
          userText;

        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                users = Array(100).fill().map(_mockBuilders.generateUser);
                members = users.map(function (u) {
                  return (0, _mockBuilders.generateMember)({
                    user: u,
                  });
                });
                messages = [
                  (0, _mockBuilders.generateMessage)({
                    user: users[0],
                  }),
                ];
                mockedChannel = (0, _mockBuilders.generateChannel)({
                  messages,
                  members,
                });
                (0, _mockBuilders.useMockedApis)(chatClient, [
                  (0, _mockBuilders.getOrCreateChannelApi)(mockedChannel),
                ]);
                activeChannel = chatClient.channel(
                  'messaging',
                  mockedChannel.id,
                );
                searchMember = members[0];
                (0, _mockBuilders.useMockedApis)(chatClient, [
                  (0, _mockBuilders.queryMembersApi)([searchMember]),
                ]);
                onSelectItem = jest.fn();
                _context11.next = 11;
                return renderComponent({
                  onSelectItem,
                  activeChannel,
                });

              case 11:
                _yield$renderComponen9 = _context11.sent;
                typeText = _yield$renderComponen9.typeText;
                findByText = _yield$renderComponen9.findByText;
                mentionedUser = searchMember.user;
                typeText('@'.concat(mentionedUser.id));
                _context11.next = 18;
                return findByText(mentionedUser.name);

              case 18:
                userText = _context11.sent;
                expect(userText).toBeInTheDocument();

                _react2.fireEvent.click(userText);

                expect(onSelectItem).toHaveBeenCalledWith(
                  expect.objectContaining({
                    id: mentionedUser.id,
                  }),
                );

              case 22:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11);
      }),
    ),
  );
});
