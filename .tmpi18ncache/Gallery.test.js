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

var _mockBuilders = require('../../../mock-builders');

var _Chat = require('../../Chat');

var _Gallery = _interopRequireDefault(require('../Gallery'));

var chatClient;
var mockGalleryAssets = [
  {
    src: 'https://placeimg.com/640/480/any',
  },
  {
    src: 'https://placeimg.com/640/480/any',
  },
  {
    src: 'https://placeimg.com/640/480/any',
  },
  {
    src: 'https://placeimg.com/640/480/any',
  },
  {
    src: 'https://placeimg.com/640/480/any',
  },
  {
    src: 'https://placeimg.com/640/480/any',
  },
];
afterEach(_react2.cleanup); // eslint-disable-line

describe('Gallery', function () {
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Gallery.default, {
          images: mockGalleryAssets.slice(0, 2),
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('should render component with 3 images', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Gallery.default, {
          images: mockGalleryAssets.slice(0, 3),
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('should render component with 4 images', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Gallery.default, {
          images: mockGalleryAssets.slice(0, 4),
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('should render component with 6 images', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Gallery.default, {
          images: mockGalleryAssets,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it(
    'should open modal on image click',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _render, getByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                jest.spyOn(console, 'warn').mockImplementation(function () {
                  return null;
                });
                (_render = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(_Gallery.default, {
                    images: mockGalleryAssets.slice(0, 1),
                  }),
                )),
                  (getByTestId = _render.getByTestId);

                _react2.fireEvent.click(getByTestId('gallery-image'));

                _context.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('modal-image')).toBeInTheDocument();
                });

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should display correct image count',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _yield$render, getByText;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)({
                  id: 'test',
                });

              case 2:
                chatClient = _context2.sent;
                _context2.next = 5;
                return (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClient,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _Gallery.default,
                      {
                        images: mockGalleryAssets,
                      },
                    ),
                    ',',
                  ),
                );

              case 5:
                _yield$render = _context2.sent;
                getByText = _yield$render.getByText;
                _context2.next = 9;
                return (0, _react2.waitFor)(function () {
                  expect(getByText('3 more')).toBeInTheDocument();
                });

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
});
