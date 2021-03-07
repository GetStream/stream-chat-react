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

var _Image = _interopRequireDefault(require('../Image'));

var mockImageAssets = 'https://placeimg.com/640/480/any';
afterEach(_react2.cleanup); // eslint-disable-line

describe('Image', function () {
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Image.default, {
          images: mockImageAssets,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  describe('it should prevent unsafe image uri protocols in the rendered image src', function () {
    it('should prevent javascript protocol in image src', function () {
      // eslint-disable-next-line no-script-url
      var xssJavascriptUri = 'javascript:alert("p0wn3d")';

      var _render = (0, _react2.render)(
          /*#__PURE__*/ _react.default.createElement(_Image.default, {
            image_url: xssJavascriptUri,
          }),
        ),
        getByTestId = _render.getByTestId;

      expect(getByTestId('image-test')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent javascript protocol in thumbnail src', function () {
      // eslint-disable-next-line no-script-url
      var xssJavascriptUri = 'javascript:alert("p0wn3d")';

      var _render2 = (0, _react2.render)(
          /*#__PURE__*/ _react.default.createElement(_Image.default, {
            thumb_url: xssJavascriptUri,
          }),
        ),
        getByTestId = _render2.getByTestId;

      expect(getByTestId('image-test')).not.toHaveAttribute(
        'src',
        xssJavascriptUri,
      );
    });
    it('should prevent dataUris in image src', function () {
      var xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';

      var _render3 = (0, _react2.render)(
          /*#__PURE__*/ _react.default.createElement(_Image.default, {
            image_url: xssDataUri,
          }),
        ),
        getByTestId = _render3.getByTestId;

      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
    it('should prevent dataUris in thumb src', function () {
      var xssDataUri = 'data:image/svg+xml;base64,DANGEROUSENCODEDSVG';

      var _render4 = (0, _react2.render)(
          /*#__PURE__*/ _react.default.createElement(_Image.default, {
            thumb_url: xssDataUri,
          }),
        ),
        getByTestId = _render4.getByTestId;

      expect(getByTestId('image-test')).not.toHaveAttribute('src', xssDataUri);
    });
  });
  it(
    'should open modal on image click',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _render5, getByTestId, getByTitle;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                jest.spyOn(console, 'warn').mockImplementation(function () {
                  return null;
                });
                (_render5 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(_Image.default, {
                    images: mockImageAssets,
                  }),
                )),
                  (getByTestId = _render5.getByTestId),
                  (getByTitle = _render5.getByTitle);

                _react2.fireEvent.click(getByTestId('image-test'));

                _context.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByTitle('Close (esc)')).toBeInTheDocument();
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
});
