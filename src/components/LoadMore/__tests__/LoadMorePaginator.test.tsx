import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { LoadMorePaginator } from '../LoadMorePaginator';
import type { LoadMorePaginatorProps } from '../LoadMorePaginator';

vi.mock('../LoadMoreButton', () => ({
  __esModule: true,
  LoadMoreButton: vi.fn(() => <div data-testid='load-more-button' />),
}));

describe('LoadMorePaginator', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { container } = render(
      <LoadMorePaginator loadNextPage={vi.fn()}>children</LoadMorePaginator>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        children
      </div>
    `);
  });

  it('should render default LoadMoreButton when hasNextPage', () => {
    const { container } = render(
      <LoadMorePaginator hasNextPage loadNextPage={vi.fn()}>
        children
      </LoadMorePaginator>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        children
        <div
          data-testid="load-more-button"
        />
      </div>
    `);
  });

  it('should render LoadMoreButton prop when hasNextPage 1', () => {
    const { container } = render(
      <LoadMorePaginator
        hasNextPage
        LoadMoreButton={() => <div>custom load more button</div>}
        loadNextPage={vi.fn()}
      >
        children
      </LoadMorePaginator>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        children
        <div>
          custom load more button
        </div>
      </div>
    `);
  });

  it('should render LoadMoreButton prop when hasNextPage 2', () => {
    const { container } = render(
      <LoadMorePaginator
        hasNextPage
        LoadMoreButton={() => <div>load more button</div>}
        loadNextPage={vi.fn()}
      >
        children
      </LoadMorePaginator>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        children
        <div>
          load more button
        </div>
      </div>
    `);
  });

  it('should render children after loader in reverse mode', () => {
    const { container } = render(
      <LoadMorePaginator
        hasNextPage
        LoadMoreButton={() => <div>load more button</div>}
        loadNextPage={vi.fn()}
        reverse
      >
        children
      </LoadMorePaginator>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          load more button
        </div>
        children
      </div>
    `);
  });

  it('should pass undefined props to LoadMoreButton if missing', async () => {
    const LoadMoreButton = vi.fn(() => <div />);

    const props = fromPartial<LoadMorePaginatorProps>({
      hasNextPage: true,
      LoadMoreButton,
    });
    render(<LoadMorePaginator {...props}>children</LoadMorePaginator>);

    await waitFor(() => {
      expect(LoadMoreButton).toHaveBeenCalledWith(
        { isLoading: undefined, onClick: undefined },
        undefined,
      );
    });
  });

  it('should pass proper props to LoadMoreButton', async () => {
    const LoadMoreButton = vi.fn(() => <div />);
    const loadNextPage = vi.fn();

    render(
      <LoadMorePaginator
        hasNextPage
        isLoading={false}
        LoadMoreButton={LoadMoreButton}
        loadNextPage={loadNextPage}
      />,
    );

    await waitFor(() => {
      expect(LoadMoreButton).toHaveBeenCalledWith(
        { isLoading: false, onClick: loadNextPage },
        undefined,
      );
    });
  });
});
