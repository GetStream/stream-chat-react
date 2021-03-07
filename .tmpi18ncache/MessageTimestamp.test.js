'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

require('@testing-library/jest-dom');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

var _mockBuilders = require('mock-builders');

var _MessageTimestamp = _interopRequireWildcard(require('../MessageTimestamp'));

var _context = require('../../../context');

var messageMock = (0, _mockBuilders.generateMessage)({
  created_at: '2019-04-03T14:42:47.087869Z',
});
describe('<MessageTimestamp />', function () {
  afterEach(_react2.cleanup);
  it('should render correctly', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: messageMock,
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <time\n        className=""\n        dateTime="2019-04-03T14:42:47.087869Z"\n        title="2019-04-03T14:42:47.087869Z"\n      >\n        2:42PM\n      </time>\n    ',
    );
  });
  it('should not render if no message is available', function () {
    jest.spyOn(console, 'warn').mockImplementationOnce(function () {
      return null;
    });

    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: undefined,
        }),
      ),
      container = _render.container;

    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      _MessageTimestamp.notValidDateWarning,
    );
  });
  it('should not render if message created_at is not a valid date', function () {
    jest.spyOn(console, 'warn').mockImplementationOnce(function () {
      return null;
    });
    var message = (0, _mockBuilders.generateMessage)({
      created_at: 'I am not a date',
    });

    var _render2 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: message,
        }),
      ),
      container = _render2.container;

    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(
      _MessageTimestamp.notValidDateWarning,
    );
  });
  it('should render message created_at date with custom datetime parser if one is set', function () {
    var format = jest.fn();
    var customDateTimeParser = jest.fn(function () {
      return {
        format,
      };
    });
    (0, _react2.render)(
      /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
        message: messageMock,
        tDateTimeParser: customDateTimeParser,
      }),
    );
    expect(format).toHaveBeenCalledWith(
      _MessageTimestamp.defaultTimestampFormat,
    );
  });
  it('should render message with custom datetime format if one is set', function () {
    var format = 'LT';

    var _render3 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: messageMock,
          format: format,
        }),
      ),
      queryByText = _render3.queryByText;

    expect(queryByText('2:42 PM')).toBeInTheDocument();
  });
  it('should render in calendar format if calendar is set to true', function () {
    var calendarDateTimeParser = {
      calendar: jest.fn(),
    };
    (0, _react2.render)(
      /*#__PURE__*/ _react.default.createElement(
        _context.TranslationContext.Provider,
        {
          value: {
            tDateTimeParser: function tDateTimeParser() {
              return calendarDateTimeParser;
            },
          },
        },
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: messageMock,
          calendar: true,
        }),
      ),
    );
    expect(calendarDateTimeParser.calendar).toHaveBeenCalledTimes(1);
  });
  it('should not render if called in calendar mode but no calendar function is available from the datetime parser', function () {
    var _render4 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _context.TranslationContext.Provider,
          {
            value: {
              tDateTimeParser: function tDateTimeParser() {
                return {
                  calendar: undefined,
                };
              },
            },
          },
          /*#__PURE__*/ _react.default.createElement(
            _MessageTimestamp.default,
            {
              message: messageMock,
              calendar: true,
            },
          ),
        ),
      ),
      container = _render4.container;

    expect(container.children).toHaveLength(0);
  });
  it('should use custom date formater when one is set', function () {
    var customDate = 'Some time ago';
    var formatDate = jest.fn(function () {
      return customDate;
    });

    var _render5 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          formatDate: formatDate,
          message: messageMock,
        }),
      ),
      queryByText = _render5.queryByText;

    expect(formatDate).toHaveBeenCalledWith(new Date(messageMock.created_at));
    expect(queryByText(customDate)).toBeInTheDocument();
  });
  it('should render message with a custom css class when one is set', function () {
    var customCssClass = 'custom-css-class';

    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          customClass: customCssClass,
          message: messageMock,
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <time\n        className="custom-css-class"\n        dateTime="2019-04-03T14:42:47.087869Z"\n        title="2019-04-03T14:42:47.087869Z"\n      >\n        2:42PM\n      </time>\n    ',
    );
  });
});
