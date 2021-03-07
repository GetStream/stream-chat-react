'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

require('@testing-library/jest-dom');

var _react2 = require('@testing-library/react');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _uuid = require('uuid');

var _AttachmentActions = _interopRequireDefault(
  require('../AttachmentActions'),
);

var getComponent = function getComponent(props) {
  return /*#__PURE__*/ _react.default.createElement(
    _AttachmentActions.default,
    props,
  );
};

var actions = [
  {
    value: 'action 1',
    name: 'action 1 name',
    text: 'action 1 text',
  },
  {
    value: 'action 2',
    name: 'action 2 name',
    text: 'action 2 text',
  },
];
describe('AttachmentActions', function () {
  it('should render AttachmentActions component', function () {
    var tree = _reactTestRenderer.default
      .create(
        getComponent({
          actions,
          id: (0, _uuid.v4)(),
          actionHandler: jest.fn(),
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it(
    'should call actionHandler on click',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var actionHandler, _render, getByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                actionHandler = jest.fn();
                (_render = (0, _react2.render)(
                  getComponent({
                    actions,
                    id: (0, _uuid.v4)(),
                    actionHandler,
                  }),
                )),
                  (getByTestId = _render.getByTestId);
                _context.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId(actions[0].name)).toBeInTheDocument();
                });

              case 4:
                _react2.fireEvent.click(getByTestId(actions[0].name));

                _react2.fireEvent.click(getByTestId(actions[1].name));

                _context.next = 8;
                return (0, _react2.waitFor)(function () {
                  // eslint-disable-next-line jest/prefer-called-with
                  expect(actionHandler).toHaveBeenCalledTimes(2);
                });

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
});
