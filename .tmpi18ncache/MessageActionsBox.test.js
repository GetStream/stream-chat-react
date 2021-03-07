'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _MessageActionsBox = _interopRequireDefault(
  require('../MessageActionsBox'),
);

var getMessageActionsMock = jest.fn(function () {
  return [];
});

var renderComponent = function renderComponent(props) {
  return (0, _react2.render)(
    /*#__PURE__*/ _react.default.createElement(
      _MessageActionsBox.default,
      (0, _extends2.default)({}, props, {
        getMessageActions: getMessageActionsMock,
      }),
    ),
  );
};

describe('MessageActionsBox', function () {
  afterEach(jest.clearAllMocks);
  it('should not show any of the action buttons if no actions are returned by getMessageActions', function () {
    var _renderComponent = renderComponent(),
      queryByText = _renderComponent.queryByText;

    expect(queryByText('Flag')).not.toBeInTheDocument();
    expect(queryByText('Mute')).not.toBeInTheDocument();
    expect(queryByText('Unmute')).not.toBeInTheDocument();
    expect(queryByText('Edit Message')).not.toBeInTheDocument();
    expect(queryByText('Delete')).not.toBeInTheDocument();
    expect(queryByText('Pin')).not.toBeInTheDocument();
    expect(queryByText('Unpin')).not.toBeInTheDocument();
  });
  it('should call the handleFlag prop if the flag button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['flag'];
    });
    var handleFlag = jest.fn();

    var _renderComponent2 = renderComponent({
        handleFlag,
      }),
      getByText = _renderComponent2.getByText;

    _react2.fireEvent.click(getByText('Flag'));

    expect(handleFlag).toHaveBeenCalledTimes(1);
  });
  it('should call the handleMute prop if the mute button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['mute'];
    });
    var handleMute = jest.fn();

    var _renderComponent3 = renderComponent({
        handleMute,
        isUserMuted: function isUserMuted() {
          return false;
        },
      }),
      getByText = _renderComponent3.getByText;

    _react2.fireEvent.click(getByText('Mute'));

    expect(handleMute).toHaveBeenCalledTimes(1);
  });
  it('should call the handleMute prop if the unmute button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['mute'];
    });
    var handleMute = jest.fn();

    var _renderComponent4 = renderComponent({
        handleMute,
        isUserMuted: function isUserMuted() {
          return true;
        },
      }),
      getByText = _renderComponent4.getByText;

    _react2.fireEvent.click(getByText('Unmute'));

    expect(handleMute).toHaveBeenCalledTimes(1);
  });
  it('should call the handleEdit prop if the edit button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['edit'];
    });
    var handleEdit = jest.fn();

    var _renderComponent5 = renderComponent({
        handleEdit,
      }),
      getByText = _renderComponent5.getByText;

    _react2.fireEvent.click(getByText('Edit Message'));

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
  it('should call the handleDelete prop if the delete button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['delete'];
    });
    var handleDelete = jest.fn();

    var _renderComponent6 = renderComponent({
        handleDelete,
      }),
      getByText = _renderComponent6.getByText;

    _react2.fireEvent.click(getByText('Delete'));

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
  it('should call the handlePin prop if the pin button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['pin'];
    });
    var handlePin = jest.fn();
    var message = (0, _mockBuilders.generateMessage)({
      pinned: false,
    });

    var _renderComponent7 = renderComponent({
        handlePin,
        message,
      }),
      getByText = _renderComponent7.getByText;

    _react2.fireEvent.click(getByText('Pin'));

    expect(handlePin).toHaveBeenCalledTimes(1);
  });
  it('should call the handlePin prop if the unpin button is clicked', function () {
    getMessageActionsMock.mockImplementationOnce(function () {
      return ['pin'];
    });
    var handlePin = jest.fn();
    var message = (0, _mockBuilders.generateMessage)({
      pinned: true,
    });

    var _renderComponent8 = renderComponent({
        handlePin,
        message,
      }),
      getByText = _renderComponent8.getByText;

    _react2.fireEvent.click(getByText('Unpin'));

    expect(handlePin).toHaveBeenCalledTimes(1);
  });
});
