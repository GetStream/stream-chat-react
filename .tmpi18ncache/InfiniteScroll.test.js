'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _InfiniteScroll = _interopRequireDefault(require('../InfiniteScroll'));

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

var loadMore = jest.fn().mockImplementation(function () {
  return Promise.resolve();
}); // Note: testing actual infinite scroll behavior is very tricky / pointless because Jest does not
// really implement offsetHeight / offsetTop / offsetParent etc. This means we'd have to mock basically everything,
// which just tests implementation rather than actual user experience.

describe('InfiniteScroll', function () {
  // not sure if there is a more 'narrow' way of capturing event listeners being added
  var divAddEventListenerSpy = jest.spyOn(
    HTMLDivElement.prototype,
    'addEventListener',
  );
  var windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
  var divRemoveEventListenerSpy = jest.spyOn(
    HTMLDivElement.prototype,
    'addEventListener',
  );
  var windowRemoveEventListenerSpy = jest.spyOn(window, 'addEventListener');
  afterEach(function () {
    jest.clearAllMocks();
  });

  var renderComponent = function renderComponent(props) {
    var renderResult = (0, _react2.render)(
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          'data-testid': 'scroll-parent',
        },
        /*#__PURE__*/ _react.default.createElement(
          _InfiniteScroll.default,
          (0, _extends2.default)(
            {
              useWindow: false,
              loadMore: loadMore,
            },
            props,
          ),
        ),
      ),
    );
    var scrollParent = renderResult.getByTestId('scroll-parent');
    return _objectSpread(
      {
        scrollParent,
      },
      renderResult,
    );
  };

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    'should bind scroll, mousewheel and resize events to the right target with useWindow as %s and useCapture as %s',
    function (useWindow, useCapture) {
      renderComponent({
        hasMore: true,
        useCapture,
        useWindow,
      });
      var addEventListenerSpy = useWindow
        ? windowAddEventListenerSpy
        : divAddEventListenerSpy;
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        useCapture,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousewheel',
        expect.any(Function),
        useCapture,
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    'should unbind scroll, mousewheel and resize events from the right target with useWindow as %s and useCapture as %s',
    function (useCapture, useWindow) {
      var _renderComponent = renderComponent({
          hasMore: true,
          useCapture,
          useWindow,
        }),
        unmount = _renderComponent.unmount;

      unmount();
      var removeEventListenerSpy = useWindow
        ? windowRemoveEventListenerSpy
        : divRemoveEventListenerSpy;
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        useCapture,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousewheel',
        expect.any(Function),
        useCapture,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function),
        useCapture,
      );
    },
  );
  describe('Rendering loader', function () {
    var getRenderResult = function getRenderResult(isReverse) {
      return _reactTestRenderer.default
        .create(
          /*#__PURE__*/ _react.default.createElement(
            _InfiniteScroll.default,
            {
              isLoading: true,
              loadMore: loadMore,
              loader: /*#__PURE__*/ _react.default.createElement(
                'div',
                {
                  key: 'loader',
                },
                'loader',
              ),
              isReverse: isReverse,
            },
            'Content',
          ),
        )
        .toJSON();
    };

    it('should render the loader in the right place if isLoading is true and isReverse is false', function () {
      expect(getRenderResult(false)).toMatchInlineSnapshot(
        '\n        <div>\n          Content\n          <div>\n            loader\n          </div>\n        </div>\n      ',
      );
    });
    it('should render the loader in the right place if isLoading is true and isReverse is true', function () {
      expect(getRenderResult(true)).toMatchInlineSnapshot(
        '\n        <div>\n          <div>\n            loader\n          </div>\n          Content\n        </div>\n      ',
      );
    });
  });
});
