import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SearchSourceResultList } from '../SearchResults';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../SearchSourceResultsContext');
jest.mock('../../../context');
jest.mock('../../../store');
jest.mock('../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator', () => {
  const InfiniteScrollPaginator = ({
    children,
    loadNextDebounceMs,
    loadNextOnScrollToBottom,
    threshold,
  }) => (
    <div
      data-debounce-ms={loadNextDebounceMs}
      data-testid='infinite-scroll'
      data-threshold={threshold}
      onClick={() => loadNextOnScrollToBottom()}
    >
      {children}
    </div>
  );
  return {
    InfiniteScrollPaginator,
  };
});

const INFINITE_SCROLL_PAGINATOR_MOCK_TEST_ID = 'infinite-scroll';

describe('SearchSourceResultList', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];

  const mockSearchSource = {
    search: jest.fn(),
    state: {},
    type: 'users',
  };

  const MockResultItem = ({ item }) => (
    <div data-testid='mock-result-item'>{item.name}</div>
  );

  const DefaultSearchResultItems = {
    channels: MockResultItem,
    messages: MockResultItem,
    users: MockResultItem,
  };

  const MockFooter = () => <div data-testid='mock-footer'>Footer</div>;

  beforeEach(() => {
    jest.clearAllMocks();

    useSearchSourceResultsContext.mockReturnValue({
      searchSource: mockSearchSource,
    });

    useComponentContext.mockReturnValue({
      SearchSourceResultListFooter: MockFooter,
    });

    useStateStore.mockReturnValue({
      items: mockItems,
    });
  });

  it('renders nothing when SearchResultItem is not found for source type', () => {
    useSearchSourceResultsContext.mockReturnValue({
      searchSource: { ...mockSearchSource, type: 'unknown' },
    });

    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    expect(
      screen.queryByTestId(INFINITE_SCROLL_PAGINATOR_MOCK_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('renders list with items and footer', () => {
    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    expect(
      screen.getByTestId(INFINITE_SCROLL_PAGINATOR_MOCK_TEST_ID),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-result-item')).toHaveLength(mockItems.length);
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('uses custom SearchResultItems when provided', () => {
    const CustomResultItem = ({ item }) => (
      <div data-testid='custom-result-item'>{item.name}</div>
    );

    const customSearchResultItems = {
      users: CustomResultItem,
    };

    render(<SearchSourceResultList SearchResultItems={customSearchResultItems} />);

    expect(screen.getAllByTestId('custom-result-item')).toHaveLength(mockItems.length);
  });

  it('passes correct props to InfiniteScrollPaginator', () => {
    const customLoadMoreThresholdPx = 100;
    const customLoadMoreDebounceMs = 200;

    render(
      <SearchSourceResultList
        loadMoreDebounceMs={customLoadMoreDebounceMs}
        loadMoreThresholdPx={customLoadMoreThresholdPx}
        SearchResultItems={DefaultSearchResultItems}
      />,
    );

    const infiniteScroll = screen.getByTestId(INFINITE_SCROLL_PAGINATOR_MOCK_TEST_ID);
    expect(infiniteScroll).toBeInTheDocument();
    expect(infiniteScroll).toHaveAttribute(
      'data-debounce-ms',
      customLoadMoreDebounceMs.toString(),
    );
    expect(infiniteScroll).toHaveAttribute(
      'data-threshold',
      customLoadMoreThresholdPx.toString(),
    );
  });

  it('handles empty items array', () => {
    useStateStore.mockReturnValue({ items: [] });

    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    expect(screen.queryByTestId('mock-result-item')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('uses default props when not provided', () => {
    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    const infiniteScroll = screen.getByTestId(INFINITE_SCROLL_PAGINATOR_MOCK_TEST_ID);
    expect(infiniteScroll).toHaveAttribute('data-debounce-ms', '100');
    expect(infiniteScroll).toHaveAttribute('data-threshold', '80');
  });

  it('renders items with correct keys', () => {
    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    const items = screen.getAllByTestId('mock-result-item');
    items.forEach((item, index) => {
      expect(item).toHaveTextContent(mockItems[index].name);
    });
  });

  it('uses custom footer component when provided through context', () => {
    const CustomFooter = () => <div data-testid='custom-footer'>Custom Footer</div>;
    useComponentContext.mockReturnValue({
      SearchSourceResultListFooter: CustomFooter,
    });

    render(<SearchSourceResultList SearchResultItems={DefaultSearchResultItems} />);

    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-footer')).not.toBeInTheDocument();
  });
});
