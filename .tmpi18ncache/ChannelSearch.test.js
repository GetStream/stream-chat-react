'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _ChannelSearch = _interopRequireDefault(require('../ChannelSearch'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('ChannelSearch', function () {
  it('should render component without any props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _ChannelSearch.default,
          null,
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__channel-search"\n      >\n        <input\n          placeholder="Search"\n          type="text"\n        />\n        <button\n          type="submit"\n        >\n          <svg\n            height="17"\n            viewBox="0 0 18 17"\n            width="18"\n            xmlns="http://www.w3.org/2000/svg"\n          >\n            <path\n              d="M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z"\n              fillRule="evenodd"\n            />\n          </svg>\n        </button>\n      </div>\n    ',
    );
  });
});
