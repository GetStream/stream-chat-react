'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _InfiniteScrollPaginator = _interopRequireDefault(
  require('../InfiniteScrollPaginator'),
);

function renderInfiniteScrollPaginator(props) {
  return /*#__PURE__*/ _react.default.createElement(
    _InfiniteScrollPaginator.default,
    (0, _extends2.default)(
      {
        loadNextPage: jest.fn().mockName('loadNextPage'),
        hasNextPage: true,
        refreshing: false,
        reverse: true,
        threshold: 50,
      },
      props,
    ),
    /*#__PURE__*/ _react.default.createElement('div', null, 'Children'),
  );
}

describe('<InfiniteScrollPaginator />', function () {
  it('should render with a default loading indicator when it is refreshing', function () {
    var rendered = _reactTestRenderer.default
      .create(
        renderInfiniteScrollPaginator({
          refreshing: true,
        }),
      )
      .toJSON();

    expect(rendered).toMatchInlineSnapshot(
      '\n      <div>\n        <div\n          className="str-chat__infinite-scroll-paginator"\n        >\n          <div\n            className="rfu-loading-indicator__spinner"\n            style={\n              Object {\n                "borderColor": "",\n                "borderTopColor": "",\n                "borderWidth": 2,\n                "height": 20,\n                "margin": "0 auto",\n                "width": 20,\n              }\n            }\n          />\n        </div>\n        <div>\n          Children\n        </div>\n      </div>\n    ',
    );
  });
  it('should render with a custom loading indicator when it is refreshing', function () {
    var CustomLoadingIndicator = function CustomLoadingIndicator() {
      return /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'custom-loading-indicator',
        },
        'loading...',
      );
    };

    var rendered = _reactTestRenderer.default
      .create(
        renderInfiniteScrollPaginator({
          refreshing: true,
          LoadingIndicator: CustomLoadingIndicator,
        }),
      )
      .toJSON();

    expect(rendered).toMatchInlineSnapshot(
      '\n      <div>\n        <div\n          className="str-chat__infinite-scroll-paginator"\n        >\n          <div\n            className="custom-loading-indicator"\n          >\n            loading...\n          </div>\n        </div>\n        <div>\n          Children\n        </div>\n      </div>\n    ',
    );
  });
  it('should render without any loading indicator when it is not refreshing', function () {
    var rendered = _reactTestRenderer.default
      .create(
        renderInfiniteScrollPaginator({
          refreshing: false,
        }),
      )
      .toJSON();

    expect(rendered).toMatchInlineSnapshot(
      '\n      <div>\n        <div>\n          Children\n        </div>\n      </div>\n    ',
    );
  });
  it('should set InfiniteScroll properties', function () {
    var loadNextPage = jest.fn();
    var hasNextPage = true;
    var refreshing = false;
    var reverse = true;
    var threshold = 20;

    var renderedinfinitescroll = _reactTestRenderer.default
      .create(
        renderInfiniteScrollPaginator({
          loadNextPage,
          hasNextPage,
          refreshing,
          reverse,
          threshold,
        }),
      )
      .toTree().rendered;

    expect(renderedinfinitescroll.props).toEqual(
      expect.objectContaining({
        loadMore: loadNextPage,
        hasMore: hasNextPage,
        isLoading: refreshing,
        isReverse: reverse,
        threshold,
        useWindow: false,
      }),
      {},
    );
  });
});
