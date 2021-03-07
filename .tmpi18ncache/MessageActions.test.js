'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

var _mockBuilders = require('mock-builders');

var _context = require('../../../context');

var _MessageActionsBox = _interopRequireDefault(
  require('../MessageActionsBox'),
);

var _MessageActions = require('../MessageActions');

jest.mock('../MessageActionsBox', function () {
  return jest.fn(function () {
    return /*#__PURE__*/ _react.default.createElement('div', null);
  });
});
var wrapperMock = document.createElement('div');
jest.spyOn(wrapperMock, 'addEventListener');
var defaultProps = {
  addNotification: function addNotification() {},
  message: (0, _mockBuilders.generateMessage)(),
  mutes: [],
  getMessageActions: function getMessageActions() {
    return ['flag', 'mute'];
  },
  messageListRect: {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  },
  setEditingState: function setEditingState() {},
  messageWrapperRef: {
    current: wrapperMock,
  },
  getMuteUserSuccessNotification: function getMuteUserSuccessNotification() {
    return 'success';
  },
  getMuteUserErrorNotification: function getMuteUserErrorNotification() {
    return 'error';
  },
  getFlagMessageErrorNotification: function getFlagMessageErrorNotification() {
    return 'error';
  },
  getFlagMessageSuccessNotification: function getFlagMessageSuccessNotification() {
    return 'success';
  },
};

function renderMessageActions(customProps) {
  var renderer =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : _react2.render;
  return renderer(
    /*#__PURE__*/ _react.default.createElement(
      _context.ChannelContext.Provider,
      {
        value: {},
      },
      /*#__PURE__*/ _react.default.createElement(
        _context.TranslationContext.Provider,
        {
          value: {
            t: function t(key) {
              return key;
            },
          },
        },
        /*#__PURE__*/ _react.default.createElement(
          _MessageActions.MessageActions,
          (0, _extends2.default)({}, defaultProps, customProps),
        ),
      ),
    ),
  );
}

var messageActionsTestId = 'message-actions';
describe('<MessageActions /> component', function () {
  afterEach(_react2.cleanup);
  beforeEach(jest.clearAllMocks);
  it('should render correctly', function () {
    var tree = renderMessageActions({}, _reactTestRenderer.default.create);
    expect(tree.toJSON()).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"\n        data-testid="message-actions"\n        onClick={[Function]}\n      >\n        <div />\n        <svg\n          height="4"\n          viewBox="0 0 11 4"\n          width="11"\n          xmlns="http://www.w3.org/2000/svg"\n        >\n          <path\n            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"\n            fillRule="nonzero"\n          />\n        </svg>\n      </div>\n    ',
    );
  });
  it('should not return anything if message has no actions available', function () {
    var _renderMessageActions = renderMessageActions({
        getMessageActions: function getMessageActions() {
          return [];
        },
      }),
      queryByTestId = _renderMessageActions.queryByTestId;

    expect(queryByTestId(messageActionsTestId)).toBeNull();
  });
  it('should open message actions box on click', function () {
    var _renderMessageActions2 = renderMessageActions(),
      getByTestId = _renderMessageActions2.getByTestId;

    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
      }),
      {},
    );

    _react2.fireEvent.click(getByTestId(messageActionsTestId));

    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
      }),
      {},
    );
  });
  it('should close message actions box when mouse leaves wrapper', function () {
    var onMouseLeave;
    wrapperMock.addEventListener.mockImplementationOnce(function (_, fn) {
      onMouseLeave = fn;
    });

    var _renderMessageActions3 = renderMessageActions(),
      getByTestId = _renderMessageActions3.getByTestId;

    _react2.fireEvent.click(getByTestId(messageActionsTestId));

    expect(wrapperMock.addEventListener).toHaveBeenCalledWith(
      'onMouseLeave',
      expect.any(Function),
    );
    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
      }),
      {},
    );
    (0, _react2.act)(function () {
      return onMouseLeave();
    });
    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
      }),
      {},
    );
  });
  it('should close message actions box when user clicks outside the action after it is opened', function () {
    var hideOptions;
    var addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementationOnce(function (_, fn) {
        hideOptions = fn;
      });

    var _renderMessageActions4 = renderMessageActions(),
      getByTestId = _renderMessageActions4.getByTestId;

    _react2.fireEvent.click(getByTestId(messageActionsTestId));

    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: true,
      }),
      {},
    );
    (0, _react2.act)(function () {
      return hideOptions();
    });
    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
      }),
      {},
    );
    addEventListenerSpy.mockClear();
  });
  it('should render the message actions box correctly', function () {
    renderMessageActions();
    expect(_MessageActionsBox.default).toHaveBeenLastCalledWith(
      expect.objectContaining({
        open: false,
        getMessageActions: defaultProps.getMessageActions,
        messageListRect: defaultProps.messageListRect,
        handleFlag: expect.any(Function),
        handleMute: expect.any(Function),
        handlePin: expect.any(Function),
        handleEdit: expect.any(Function),
        handleDelete: expect.any(Function),
        isUserMuted: expect.any(Function),
        mine: false,
      }),
      {},
    );
  });
  it('should remove event listener when unmounted', function () {
    var _renderMessageActions5 = renderMessageActions(),
      unmount = _renderMessageActions5.unmount;

    var removeEventListener = jest.spyOn(document, 'removeEventListener');
    expect(document.removeEventListener).not.toHaveBeenCalled();
    unmount();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
    );
    removeEventListener.mockClear();
  });
  it('should render with a custom wrapper class when one is set', function () {
    var tree = renderMessageActions(
      {
        customWrapperClass: 'custom-wrapper-class',
      },
      _reactTestRenderer.default.create,
    );
    expect(tree.toJSON()).toMatchInlineSnapshot(
      '\n      <div\n        className="custom-wrapper-class"\n        data-testid="message-actions"\n        onClick={[Function]}\n      >\n        <div />\n        <svg\n          height="4"\n          viewBox="0 0 11 4"\n          width="11"\n          xmlns="http://www.w3.org/2000/svg"\n        >\n          <path\n            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"\n            fillRule="nonzero"\n          />\n        </svg>\n      </div>\n    ',
    );
  });
  it('should render with an inline element wrapper when inline set', function () {
    var tree = renderMessageActions(
      {
        inline: true,
      },
      _reactTestRenderer.default.create,
    );
    expect(tree.toJSON()).toMatchInlineSnapshot(
      '\n      <span\n        className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"\n        data-testid="message-actions"\n        onClick={[Function]}\n      >\n        <div />\n        <svg\n          height="4"\n          viewBox="0 0 11 4"\n          width="11"\n          xmlns="http://www.w3.org/2000/svg"\n        >\n          <path\n            d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"\n            fillRule="nonzero"\n          />\n        </svg>\n      </span>\n    ',
    );
  });
});
