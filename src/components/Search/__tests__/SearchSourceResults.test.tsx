import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { UserSearchSource } from 'stream-chat';
import type { SearchSourceState, StreamChat } from 'stream-chat';

import { SearchSourceResults } from '../SearchResults';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { ComponentProvider, TranslationProvider } from '../../../context';
import type { ComponentContextValue } from '../../../context';
import {
  getTestClientWithUser,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

describe('SearchSourceResults', () => {
  let client: StreamChat;
  let searchSource: UserSearchSource;

  const SearchSourceResultList = () => <div data-testid='result-list'>Results List</div>;

  const renderResults = (componentContext: Partial<ComponentContextValue> = {}) => {
    const ui = (overrides: Partial<ComponentContextValue>) => (
      <TranslationProvider value={mockTranslationContextValue()}>
        <ComponentProvider
          value={mockComponentContext({ SearchSourceResultList, ...overrides })}
        >
          <SearchSourceResults searchSource={searchSource} />
        </ComponentProvider>
      </TranslationProvider>
    );
    const result = render(ui(componentContext));
    return {
      ...result,
      rerender: (overrides: Partial<ComponentContextValue> = componentContext) =>
        result.rerender(ui(overrides)),
    };
  };

  const setSourceState = (state: Partial<SearchSourceState>) =>
    act(() => {
      searchSource.state.partialNext(state);
    });

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'test-user' });
    searchSource = new UserSearchSource(client);
    vi.spyOn(searchSource, 'search').mockResolvedValue(undefined);
  });

  it('renders nothing before the source searched', () => {
    searchSource.state.partialNext({ isLoading: false, items: undefined });

    renderResults();

    expect(screen.queryByTestId('search-source-results')).not.toBeInTheDocument();
  });

  it('renders the header and the results list when items exist', () => {
    const SearchSourceResultsHeader = () => <div data-testid='header'>Header</div>;
    searchSource.state.partialNext({ items: [{ id: 'u1' }, { id: 'u2' }] });

    renderResults({ SearchSourceResultsHeader });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('result-list')).toBeInTheDocument();
  });

  it('keeps the results list while a next page loads', () => {
    searchSource.state.partialNext({ isLoading: true, items: [{ id: 'u1' }] });

    const { container } = renderResults();

    expect(screen.getByTestId('result-list')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__search-source-results__first-page-loading'),
    ).not.toBeInTheDocument();
  });

  describe('first page loading', () => {
    it('renders the results list, which shows the loading state in its footer, while the first page loads', () => {
      searchSource.state.partialNext({ isLoading: true, items: undefined });

      renderResults();

      // The stub list stands for `SearchSourceResultList`, which renders the footer.
      expect(screen.getByTestId('result-list')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  describe('empty', () => {
    it('renders "No results found" by default', () => {
      searchSource.state.partialNext({ isLoading: false, items: [] });

      const { container } = renderResults();

      expect(
        container.querySelector('.str-chat__search-source-results-empty'),
      ).toHaveTextContent('No results found');
      expect(screen.queryByTestId('result-list')).not.toBeInTheDocument();
    });

    it('renders ListEmptyUI', () => {
      const ListEmptyUI = vi.fn(() => <div>Custom empty</div>);
      searchSource.state.partialNext({ isLoading: false, items: [] });

      renderResults({ ListEmptyUI });

      expect(screen.getByText('Custom empty')).toBeInTheDocument();
      expect(ListEmptyUI.mock.lastCall?.[0]).toEqual({});
    });

    it('renders the deprecated SearchSourceResultsEmpty instead while set', () => {
      const ListEmptyUI = vi.fn(() => null);
      searchSource.state.partialNext({ isLoading: false, items: [] });

      renderResults({
        ListEmptyUI,
        SearchSourceResultsEmpty: () => <div>Deprecated empty</div>,
      });

      expect(screen.getByText('Deprecated empty')).toBeInTheDocument();
      expect(ListEmptyUI).not.toHaveBeenCalled();
    });

    it('renders no empty state when the deprecated SearchSourceResultsEmpty is null', () => {
      const ListEmptyUI = vi.fn(() => <div>Custom empty</div>);
      searchSource.state.partialNext({ isLoading: false, items: [] });

      renderResults({
        ListEmptyUI,
        // Apps turn the state off with `null`, which the key's type does not name.
        SearchSourceResultsEmpty: null as unknown as undefined,
      });

      expect(ListEmptyUI).not.toHaveBeenCalled();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
      expect(screen.queryByTestId('result-list')).not.toBeInTheDocument();
    });

    it('does not render the empty state while a query runs on an empty list', () => {
      const ListEmptyUI = vi.fn(() => null);
      searchSource.state.partialNext({ isLoading: true, items: [] });

      renderResults({ ListEmptyUI });

      expect(ListEmptyUI).not.toHaveBeenCalled();
      expect(screen.getByTestId('result-list')).toBeInTheDocument();
    });
  });

  describe('first page failed', () => {
    const searchError = new Error('search failed');
    const failFirstPage = () =>
      searchSource.state.partialNext({
        isLoading: false,
        items: undefined,
        lastQueryError: searchError,
        searchQuery: 'bo',
      });

    it('renders the header and the ListLoadErrorUI in place of the results', () => {
      const SearchSourceResultsHeader = () => <div data-testid='header'>Header</div>;
      failFirstPage();

      renderResults({ SearchSourceResultsHeader });

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      expect(screen.queryByTestId('result-list')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });

    it('renders the app ListLoadErrorUI with the error', () => {
      const ListLoadErrorUI = ({ error }: { error: Error }) => (
        <div data-testid='load-error'>{error.message}</div>
      );
      failFirstPage();

      renderResults({ ListLoadErrorUI });

      expect(screen.getByTestId('load-error')).toHaveTextContent('search failed');
    });

    it('runs the failed search query again at once on Try again, keeping the error up meanwhile', () => {
      failFirstPage();
      searchSource.activate();
      const cancelScheduledQuery = vi.spyOn(searchSource, 'cancelScheduledQuery');
      const executeQuery = vi
        .spyOn(searchSource, 'executeQuery')
        .mockImplementation(() => new Promise<void>(() => undefined));

      renderResults();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(executeQuery).toHaveBeenCalledTimes(1);
      expect(executeQuery).toHaveBeenCalledWith('bo');
      // A query typed within its debounce still runs after the retry and replaces it.
      expect(cancelScheduledQuery).not.toHaveBeenCalled();
      setSourceState({ isLoading: true, lastQueryError: undefined });
      expect(screen.getByRole('button', { name: 'Try again' })).toHaveAttribute(
        'aria-busy',
        'true',
      );
    });

    it('shows the results once the retry loads them', async () => {
      failFirstPage();
      searchSource.activate();
      vi.spyOn(searchSource, 'executeQuery').mockImplementation(() => {
        searchSource.state.partialNext({
          isLoading: false,
          items: [{ id: 'u1' }],
          lastQueryError: undefined,
        });
        return Promise.resolve();
      });

      renderResults();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

      expect(await screen.findByTestId('result-list')).toBeInTheDocument();
      expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
    });

    it('keeps the loaded results when a further page fails', () => {
      searchSource.state.partialNext({
        isLoading: false,
        items: [{ id: 'u1' }],
        lastQueryError: searchError,
      });

      renderResults();

      expect(screen.getByTestId('result-list')).toBeInTheDocument();
      expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
    });
  });

  it('provides searchSource context to children', () => {
    const ContextConsumer = () => {
      const { searchSource } = useSearchSourceResultsContext();
      return <div data-testid='context-consumer'>{searchSource.type}</div>;
    };
    searchSource.state.partialNext({ items: [{ id: 'u1' }] });

    renderResults({ SearchSourceResultList: ContextConsumer });

    expect(screen.getByTestId('context-consumer')).toHaveTextContent('users');
  });

  it('follows the source state from searching to results to empty', () => {
    renderResults();
    expect(screen.queryByTestId('search-source-results')).not.toBeInTheDocument();

    setSourceState({ isLoading: true, items: undefined });
    expect(screen.getByTestId('result-list')).toBeInTheDocument();

    setSourceState({ isLoading: false, items: [{ id: 'u1' }] });
    expect(screen.getByTestId('result-list')).toBeInTheDocument();

    setSourceState({ items: [] });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
