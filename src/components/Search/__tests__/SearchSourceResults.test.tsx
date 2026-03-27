import { render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { SearchSource } from 'stream-chat';

import { SearchSourceResults } from '../SearchResults';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

vi.mock('../../../context');
vi.mock('../../../store');

describe('SearchSourceResults', () => {
  const mockSearchSource = fromPartial<SearchSource>({
    state: {},
    type: 'users',
  });

  const DefaultSearchSourceResultList = () => (
    <div data-testid='default-result-list'>Results List</div>
  );

  const DefaultSearchSourceResultsEmpty = () => (
    <div data-testid='default-empty-state'>No Results</div>
  );

  const DefaultSearchSourceResultsHeader = () => (
    <div data-testid='default-header'>Header</div>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useComponentContext).mockReturnValue({
      SearchSourceResultList: DefaultSearchSourceResultList,
      SearchSourceResultsEmpty: DefaultSearchSourceResultsEmpty,
      SearchSourceResultsHeader: DefaultSearchSourceResultsHeader,
    });

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [],
    });
  });

  it('renders nothing when no items and not loading', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: null,
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.queryByTestId('search-source-results')).not.toBeInTheDocument();
  });

  it('renders header and empty state when no items', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('default-header')).toBeInTheDocument();
    expect(screen.getByTestId('default-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('default-result-list')).not.toBeInTheDocument();
  });

  it('renders header and results list when items exist', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [{ id: 1 }, { id: 2 }],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('default-header')).toBeInTheDocument();
    expect(screen.getByTestId('default-result-list')).toBeInTheDocument();
    expect(screen.queryByTestId('default-empty-state')).not.toBeInTheDocument();
  });

  it('renders header and results list when loading', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: true,
      items: [],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('default-header')).toBeInTheDocument();
    expect(screen.getByTestId('default-result-list')).toBeInTheDocument();
    expect(screen.queryByTestId('default-empty-state')).not.toBeInTheDocument();
  });

  it('uses custom components when provided', () => {
    const CustomResultList = () => (
      <div data-testid='custom-result-list'>Custom List</div>
    );
    const CustomEmpty = () => <div data-testid='custom-empty'>Custom Empty</div>;
    const CustomHeader = () => <div data-testid='custom-header'>Custom Header</div>;

    vi.mocked(useComponentContext).mockReturnValue({
      SearchSourceResultList: CustomResultList,
      SearchSourceResultsEmpty: CustomEmpty,
      SearchSourceResultsHeader: CustomHeader,
    });

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [],
    });

    const { rerender } = render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-result-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: ['x'],
    });

    rerender(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-result-list')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-empty')).not.toBeInTheDocument();
  });

  it('provides searchSource context to children', async () => {
    const { SearchSourceResultsContext } = await vi.importActual<
      typeof import('../SearchSourceResultsContext')
    >('../SearchSourceResultsContext');
    const ContextConsumer = () => {
      const context = React.useContext(SearchSourceResultsContext);
      return <div data-testid='context-consumer'>{context?.searchSource.type}</div>;
    };

    const CustomResultList = () => (
      <div data-testid='custom-result-list'>
        <ContextConsumer />
      </div>
    );

    vi.mocked(useComponentContext).mockReturnValue({
      ...vi.mocked(useComponentContext)(),
      SearchSourceResultList: CustomResultList,
    });

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [{ id: 1 }],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('context-consumer')).toHaveTextContent('users');
  });

  it('handles state updates correctly', () => {
    const { rerender } = render(<SearchSourceResults searchSource={mockSearchSource} />);

    // Initial empty state
    expect(screen.getByTestId('default-empty-state')).toBeInTheDocument();

    // Update to loading state
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: true,
      items: undefined,
    });
    rerender(<SearchSourceResults searchSource={mockSearchSource} />);
    expect(screen.queryByTestId('default-result-list')).toBeInTheDocument();

    // Update to having items
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      items: [{ id: 1 }],
    });
    rerender(<SearchSourceResults searchSource={mockSearchSource} />);
    expect(screen.getByTestId('default-result-list')).toBeInTheDocument();
  });
});
