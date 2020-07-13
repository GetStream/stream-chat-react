import React from 'react';
import renderer from 'react-test-renderer';
import InfiniteScrollPaginator from '../InfiniteScrollPaginator';

function renderInfiniteScrollPaginator(props) {
  return (
    <InfiniteScrollPaginator
      loadNextPage={jest.fn().mockName('loadNextPage')}
      hasNextPage={true}
      refreshing={false}
      reverse={true}
      threshold={50}
      {...props}
    >
      <div>Children</div>
    </InfiniteScrollPaginator>
  );
}

describe('<InfiniteScrollPaginator />', () => {
  it('should render with a default loading indicator when it is refreshing', () => {
    const rendered = renderer
      .create(renderInfiniteScrollPaginator({ refreshing: true }))
      .toJSON();
    expect(rendered).toMatchInlineSnapshot(`
      <div>
        <div
          className="str-chat__infinite-scroll-paginator"
        >
          <div
            className="rfu-loading-indicator__spinner"
            style={
              Object {
                "borderColor": "",
                "borderTopColor": "",
                "borderWidth": 2,
                "height": 20,
                "margin": "0 auto",
                "width": 20,
              }
            }
          />
        </div>
        <div>
          Children
        </div>
      </div>
    `);
  });

  it('should render with a custom loading indicator when it is refreshing', () => {
    const CustomLoadingIndicator = () => (
      <div className="custom-loading-indicator">loading...</div>
    );
    const rendered = renderer
      .create(
        renderInfiniteScrollPaginator({
          refreshing: true,
          LoadingIndicator: CustomLoadingIndicator,
        }),
      )
      .toJSON();
    expect(rendered).toMatchInlineSnapshot(`
      <div>
        <div
          className="str-chat__infinite-scroll-paginator"
        >
          <div
            className="custom-loading-indicator"
          >
            loading...
          </div>
        </div>
        <div>
          Children
        </div>
      </div>
    `);
  });

  it('should render without any loading indicator when it is not refreshing', () => {
    const rendered = renderer
      .create(
        renderInfiniteScrollPaginator({
          refreshing: false,
        }),
      )
      .toJSON();
    expect(rendered).toMatchInlineSnapshot(`
      <div>
        <div>
          Children
        </div>
      </div>
    `);
  });

  it('should set InfiniteScroll properties', () => {
    const loadNextPage = jest.fn();
    const hasNextPage = true;
    const refreshing = false;
    const reverse = true;
    const threshold = 20;
    const renderedinfinitescroll = renderer
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
