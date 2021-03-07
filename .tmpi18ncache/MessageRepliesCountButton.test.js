'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _MessageRepliesCountButton = _interopRequireDefault(
  require('../MessageRepliesCountButton'),
);

var _context = require('../../../context');

var onClickMock = jest.fn();

var i18nMock = function i18nMock(key) {
  return key;
};

var renderComponent = function renderComponent(props) {
  return (0, _react2.render)(
    /*#__PURE__*/ _react.default.createElement(
      _context.TranslationContext.Provider,
      {
        value: {
          t: i18nMock,
        },
      },
      /*#__PURE__*/ _react.default.createElement(
        _MessageRepliesCountButton.default,
        (0, _extends2.default)({}, props, {
          onClick: onClickMock,
        }),
      ),
    ),
  );
};

describe('MessageRepliesCountButton', function () {
  afterEach(function () {
    jest.clearAllMocks();
    (0, _react2.cleanup)();
  });
  it('should render the right text when there is one reply, and labelSingle is not defined', function () {
    var _renderComponent = renderComponent({
        reply_count: 1,
      }),
      getByText = _renderComponent.getByText;

    expect(getByText('1 reply')).toBeInTheDocument();
  });
  it('should render the right text when there is one reply, and labelSingle is defined', function () {
    var labelSingle = 'text';

    var _renderComponent2 = renderComponent({
        reply_count: 1,
        labelSingle,
      }),
      getByText = _renderComponent2.getByText;

    expect(getByText('1 '.concat(labelSingle))).toBeInTheDocument();
  });
  it('should render the right text when there is more than one reply, and labelPlural is not defined', function () {
    var _renderComponent3 = renderComponent({
        reply_count: 2,
      }),
      getByText = _renderComponent3.getByText;

    expect(getByText('{{ replyCount }} replies')).toBeInTheDocument();
  });
  it('should render the right text when there is more than one reply, and labelPlural is defined', function () {
    var labelPlural = 'text';

    var _renderComponent4 = renderComponent({
        reply_count: 2,
        labelPlural,
      }),
      getByText = _renderComponent4.getByText;

    expect(getByText('2 '.concat(labelPlural))).toBeInTheDocument();
  });
  it('should call the onClick prop if the button is clicked', function () {
    var _renderComponent5 = renderComponent({
        reply_count: 1,
      }),
      getByTestId = _renderComponent5.getByTestId;

    _react2.fireEvent.click(getByTestId('replies-count-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
  it('should not render anything if reply_count is 0 or undefined', function () {
    var _renderComponent6 = renderComponent({
        reply_count: 0,
      }),
      queryByTestId = _renderComponent6.queryByTestId;

    expect(queryByTestId('replies-count-button')).not.toBeInTheDocument();
  });
});
