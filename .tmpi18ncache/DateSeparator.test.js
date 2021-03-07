'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _dayjs = _interopRequireDefault(require('dayjs'));

var _calendar = _interopRequireDefault(require('dayjs/plugin/calendar'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _DateSeparator = _interopRequireDefault(require('../DateSeparator'));

var _context = require('../../../context');

_dayjs.default.extend(_calendar.default);

afterEach(_react2.cleanup); // eslint-disable-line
// this changes every time tests are run,
// but by mocking the actual renderers tests are still deterministic

var now = new Date();

var withContext = function withContext(props) {
  var t = jest.fn(function (key) {
    return key;
  });
  var tDateTimeParser = jest.fn(function (input) {
    return (0, _dayjs.default)(input);
  });

  var Component = /*#__PURE__*/ _react.default.createElement(
    _context.TranslationContext.Provider,
    {
      value: {
        t,
        tDateTimeParser,
      },
    },
    /*#__PURE__*/ _react.default.createElement(_DateSeparator.default, props),
  );

  return {
    Component,
    t,
    tDateTimeParser,
  };
};

describe('DateSeparator', function () {
  it('should use formatDate if it is provided', function () {
    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_DateSeparator.default, {
          formatDate: function formatDate() {
            return 'the date';
          },
          date: now,
        }),
      ),
      queryByText = _render.queryByText;

    expect(queryByText('the date')).toBeInTheDocument();
  });
  it('should render New text if unread prop is true', function () {
    var _withContext = withContext({
        date: now,
        unread: true,
      }),
      Component = _withContext.Component,
      t = _withContext.t;

    var _render2 = (0, _react2.render)(Component),
      queryByText = _render2.queryByText;

    expect(queryByText('New')).toBeInTheDocument();
    expect(t).toHaveBeenCalledWith('New');
  });
  it('should render properly for unread', function () {
    var _withContext2 = withContext({
        date: now,
        unread: true,
      }),
      Component = _withContext2.Component;

    var tree = _reactTestRenderer.default.create(Component).toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__date-separator"\n      >\n        <hr\n          className="str-chat__date-separator-line"\n        />\n        <div\n          className="str-chat__date-separator-date"\n        >\n          New\n        </div>\n      </div>\n    ',
    );
  });
  it("should use tDateTimeParser's calendar method by default", function () {
    var _withContext3 = withContext({
        date: now,
      }),
      Component = _withContext3.Component,
      tDateTimeParser = _withContext3.tDateTimeParser;

    var _render3 = (0, _react2.render)(Component),
      queryByText = _render3.queryByText;

    expect(tDateTimeParser).toHaveBeenCalledWith(now.toISOString());
    expect(
      queryByText((0, _dayjs.default)(now.toISOString()).calendar()),
    ).toBeInTheDocument();
  });
  describe('Position prop', function () {
    var renderWithPosition = function renderWithPosition(position) {
      return /*#__PURE__*/ _react.default.createElement(
        _DateSeparator.default,
        {
          formatDate: function formatDate() {
            return 'the date';
          },
          date: now,
          position: position,
        },
      );
    };

    var defaultPosition = _reactTestRenderer.default
      .create(renderWithPosition())
      .toJSON();

    it('should render correctly with position==="right", and it should match the default', function () {
      var tree = _reactTestRenderer.default
        .create(renderWithPosition('right'))
        .toJSON();

      expect(tree).toMatchInlineSnapshot(
        '\n        <div\n          className="str-chat__date-separator"\n        >\n          <hr\n            className="str-chat__date-separator-line"\n          />\n          <div\n            className="str-chat__date-separator-date"\n          >\n            the date\n          </div>\n        </div>\n      ',
      );
      expect(defaultPosition).toStrictEqual(tree);
    });
    it('should render correctly with position==="left"', function () {
      var tree = _reactTestRenderer.default
        .create(renderWithPosition('left'))
        .toJSON();

      expect(tree).toMatchInlineSnapshot(
        '\n        <div\n          className="str-chat__date-separator"\n        >\n          <div\n            className="str-chat__date-separator-date"\n          >\n            the date\n          </div>\n          <hr\n            className="str-chat__date-separator-line"\n          />\n        </div>\n      ',
      );
    });
    it('should render correctly with position==="center"', function () {
      var tree = _reactTestRenderer.default
        .create(renderWithPosition('center'))
        .toJSON();

      expect(tree).toMatchInlineSnapshot(
        '\n        <div\n          className="str-chat__date-separator"\n        >\n          <hr\n            className="str-chat__date-separator-line"\n          />\n          <div\n            className="str-chat__date-separator-date"\n          >\n            the date\n          </div>\n          <hr\n            className="str-chat__date-separator-line"\n          />\n        </div>\n      ',
      );
    });
  });
});
