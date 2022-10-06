import React from 'react';
import renderer from 'react-test-renderer';
import { cleanup, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadMorePaginator } from '../LoadMorePaginator';

jest.mock('../LoadMoreButton', () => ({
  __esModule: true,
  LoadMoreButton: jest.fn(() => <div data-testid='load-more-button' />),
}));

describe('LoadMorePaginator', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const tree = renderer
      .create(<LoadMorePaginator loadNextPage={jest.fn()}>children</LoadMorePaginator>)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`"children"`);
  });

  it('should render default LoadMoreButton when hasNextPage', () => {
    const tree = renderer
      .create(
        <LoadMorePaginator hasNextPage loadNextPage={jest.fn()}>
          children
        </LoadMorePaginator>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      Array [
        "children",
        <div
          data-testid="load-more-button"
        />,
      ]
    `);
  });

  it('should render LoadMoreButton prop when hasNextPage 1', () => {
    const tree = renderer
      .create(
        <LoadMorePaginator
          hasNextPage
          LoadMoreButton={() => <div>custom load more button</div>}
          loadNextPage={jest.fn()}
        >
          children
        </LoadMorePaginator>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      Array [
        "children",
        <div>
          custom load more button
        </div>,
      ]
    `);
  });

  it('should render LoadMoreButton prop when hasNextPage 2', () => {
    const tree = renderer
      .create(
        <LoadMorePaginator
          hasNextPage
          LoadMoreButton={() => <div>load more button</div>}
          loadNextPage={jest.fn()}
        >
          children
        </LoadMorePaginator>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      Array [
        "children",
        <div>
          load more button
        </div>,
      ]
    `);
  });

  it('should render children after loader in reverse mode', () => {
    const tree = renderer
      .create(
        <LoadMorePaginator
          hasNextPage
          LoadMoreButton={() => <div>load more button</div>}
          loadNextPage={jest.fn()}
          reverse
        >
          children
        </LoadMorePaginator>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      Array [
        <div>
          load more button
        </div>,
        "children",
      ]
    `);
  });

  it('should pass undefined props to LoadMoreButton if missing', async () => {
    const LoadMoreButton = jest.fn(() => <div />);

    render(
      <LoadMorePaginator hasNextPage LoadMoreButton={LoadMoreButton}>
        children
      </LoadMorePaginator>,
    );

    await waitFor(() => {
      expect(LoadMoreButton).toHaveBeenCalledWith(
        { isLoading: undefined, onClick: undefined, refreshing: undefined },
        {},
      );
    });
  });

  it('should pass proper props to LoadMoreButton', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => null);
    const LoadMoreButton = jest.fn(() => <div />);
    const loadNextPage = jest.fn();

    render(
      <LoadMorePaginator
        hasNextPage
        isLoading={false}
        LoadMoreButton={LoadMoreButton}
        loadNextPage={loadNextPage}
        refreshing={true}
      />,
    );

    consoleWarnSpy.mockRestore();
    await waitFor(() => {
      expect(LoadMoreButton).toHaveBeenCalledWith({ isLoading: false, onClick: loadNextPage }, {});
    });
  });
});
