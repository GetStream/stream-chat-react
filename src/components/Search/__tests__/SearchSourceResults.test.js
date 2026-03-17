import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SearchSourceResults } from '../SearchResults';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../../../context');
jest.mock('../../../store');

describe('SearchSourceResults', () => {
  const mockSearchSource = {
    state: {},
    type: 'users',
  };

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
    jest.clearAllMocks();

    useComponentContext.mockReturnValue({
      SearchSourceResultList: DefaultSearchSourceResultList,
      SearchSourceResultsEmpty: DefaultSearchSourceResultsEmpty,
      SearchSourceResultsHeader: DefaultSearchSourceResultsHeader,
    });

    useStateStore.mockReturnValue({
      isLoading: false,
      items: [],
    });
  });

  it('renders nothing when no items and not loading', () => {
    useStateStore.mockReturnValue({
      isLoading: false,
      items: null,
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.queryByTestId('search-source-results')).not.toBeInTheDocument();
  });

  it('renders header and empty state when no items', () => {
    useStateStore.mockReturnValue({
      isLoading: false,
      items: [],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('default-header')).toBeInTheDocument();
    expect(screen.getByTestId('default-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('default-result-list')).not.toBeInTheDocument();
  });

  it('renders header and results list when items exist', () => {
    useStateStore.mockReturnValue({
      isLoading: false,
      items: [{ id: 1 }, { id: 2 }],
    });

    render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('default-header')).toBeInTheDocument();
    expect(screen.getByTestId('default-result-list')).toBeInTheDocument();
    expect(screen.queryByTestId('default-empty-state')).not.toBeInTheDocument();
  });

  it('renders header and results list when loading', () => {
    useStateStore.mockReturnValue({
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

    useComponentContext.mockReturnValue({
      SearchSourceResultList: CustomResultList,
      SearchSourceResultsEmpty: CustomEmpty,
      SearchSourceResultsHeader: CustomHeader,
    });

    useStateStore.mockReturnValue({
      isLoading: false,
      items: [],
    });

    const { rerender } = render(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-result-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();

    useStateStore.mockReturnValue({
      isLoading: false,
      items: ['x'],
    });

    rerender(<SearchSourceResults searchSource={mockSearchSource} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-result-list')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-empty')).not.toBeInTheDocument();
  });

  it('provides searchSource context to children', () => {
    const ContextConsumer = () => {
      const context = React.useContext(
        jest.requireActual('../SearchSourceResultsContext').SearchSourceResultsContext,
      );
      return <div data-testid='context-consumer'>{context.searchSource.type}</div>;
    };

    const CustomResultList = () => (
      <div data-testid='custom-result-list'>
        <ContextConsumer />
      </div>
    );

    useComponentContext.mockReturnValue({
      ...useComponentContext(),
      SearchSourceResultList: CustomResultList,
    });

    useStateStore.mockReturnValue({
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
    useStateStore.mockReturnValue({
      isLoading: true,
      items: undefined,
    });
    rerender(<SearchSourceResults searchSource={mockSearchSource} />);
    expect(screen.queryByTestId('default-result-list')).toBeInTheDocument();

    // Update to having items
    useStateStore.mockReturnValue({
      isLoading: false,
      items: [{ id: 1 }],
    });
    rerender(<SearchSourceResults searchSource={mockSearchSource} />);
    expect(screen.getByTestId('default-result-list')).toBeInTheDocument();
  });
});
