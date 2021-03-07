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

var _ChatDown = _interopRequireDefault(require('../ChatDown'));

describe('ChatDown', function () {
  afterEach(_react2.cleanup);
  it('should render component with its default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_ChatDown.default, null),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it(
    'should render component with custom text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var text, _render, getByText;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                text = 'custom text';
                (_render = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _ChatDown.default,
                    {
                      text: text,
                    },
                  ),
                )),
                  (getByText = _render.getByText);
                _context.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByText(text)).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should render component with custom image url',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var image, Component, _render2, getByTestId, tree;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                image = 'https://random.url/image.png';
                Component = /*#__PURE__*/ _react.default.createElement(
                  _ChatDown.default,
                  {
                    image: image,
                  },
                );
                (_render2 = (0, _react2.render)(Component)),
                  (getByTestId = _render2.getByTestId);
                _context2.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('chatdown-img')).toHaveAttribute(
                    'src',
                    image,
                  );
                });

              case 5:
                tree = _reactTestRenderer.default.create(Component).toJSON();
                expect(tree).toMatchSnapshot();

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should render component with custom type',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var type, _render3, getByText;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                type = 'Warning';
                (_render3 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _ChatDown.default,
                    {
                      type: type,
                    },
                  ),
                )),
                  (getByText = _render3.getByText);
                _context3.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByText(type)).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
});
