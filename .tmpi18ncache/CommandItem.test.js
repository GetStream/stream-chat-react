'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _CommandItem = _interopRequireDefault(require('../CommandItem'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('commandItem', function () {
  it('should render component with empty entity', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_CommandItem.default, {
          entity: {},
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__slash-command"\n      >\n        <span\n          className="str-chat__slash-command-header"\n        >\n          <strong />\n           \n        </span>\n        <br />\n        <span\n          className="str-chat__slash-command-description"\n        />\n      </div>\n    ',
    );
  });
  it('should render component with custom entity prop', function () {
    var entity = {
      name: 'name',
      args: 'args',
      description: 'description',
    };

    var Component = /*#__PURE__*/ _react.default.createElement(
      _CommandItem.default,
      {
        entity: entity,
      },
    );

    var _render = (0, _react2.render)(Component),
      getByText = _render.getByText;

    expect(getByText(entity.name)).toBeInTheDocument();
    expect(getByText(entity.args)).toBeInTheDocument();
    expect(getByText(entity.description)).toBeInTheDocument();

    var tree = _reactTestRenderer.default.create(Component).toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__slash-command"\n      >\n        <span\n          className="str-chat__slash-command-header"\n        >\n          <strong>\n            name\n          </strong>\n           \n          args\n        </span>\n        <br />\n        <span\n          className="str-chat__slash-command-description"\n        >\n          description\n        </span>\n      </div>\n    ',
    );
  });
});
