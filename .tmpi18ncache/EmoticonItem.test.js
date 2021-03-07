'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _EmoticonItem = _interopRequireDefault(require('../EmoticonItem'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('EmoticonItem', function () {
  it('should render component with empty entity', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_EmoticonItem.default, {
          entity: {},
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__emoji-item"\n      >\n        <span\n          className="str-chat__emoji-item--entity"\n        />\n        <span\n          className="str-chat__emoji-item--name"\n        />\n      </div>\n    ',
    );
  });
  it(
    'should render component with custom entity prop',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var entity, Component, _render, getByText, tree;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                entity = {
                  name: 'name',
                  native: 'native',
                };
                Component = /*#__PURE__*/ _react.default.createElement(
                  _EmoticonItem.default,
                  {
                    entity: entity,
                  },
                );
                (_render = (0, _react2.render)(Component)),
                  (getByText = _render.getByText);
                _context.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByText(entity.name)).toBeInTheDocument();
                  expect(getByText(entity.native)).toBeInTheDocument();
                });

              case 5:
                tree = _reactTestRenderer.default.create(Component).toJSON();
                expect(tree).toMatchInlineSnapshot(
                  '\n      <div\n        className="str-chat__emoji-item"\n      >\n        <span\n          className="str-chat__emoji-item--entity"\n        >\n          native\n        </span>\n        <span\n          className="str-chat__emoji-item--name"\n        >\n          name\n        </span>\n      </div>\n    ',
                );

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
});
