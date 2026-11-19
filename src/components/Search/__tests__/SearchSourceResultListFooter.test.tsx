import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { UserSearchSource } from 'stream-chat';
import type { SearchSourceState } from 'stream-chat';

import { SearchSourceResultListFooter } from '../SearchResults';
import { SearchSourceResultsContextProvider } from '../SearchSourceResultsContext';
import { ComponentProvider, TranslationProvider } from '../../../context';
import type { ComponentContextValue } from '../../../context';
import {
  getTestClientWithUser,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const SEARCH_FOOTER_TEST_ID = 'search-footer';
const SEARCH_LOADING_TEST_ID = 'search-loading-indicator';

describe('SearchSourceResultListFooter', () => {
  let searchSource: UserSearchSource;

  const renderFooter = (
    componentContext: Partial<ComponentContextValue> = {},
    t = mockTranslationContextValue().t,
  ) =>
    render(
      <TranslationProvider value={mockTranslationContextValue({ t })}>
        <ComponentProvider value={mockComponentContext(componentContext)}>
          <SearchSourceResultsContextProvider value={{ searchSource }}>
            <SearchSourceResultListFooter />
          </SearchSourceResultsContextProvider>
        </ComponentProvider>
      </TranslationProvider>,
    );

  const setSourceState = (state: Partial<SearchSourceState>) =>
    act(() => {
      searchSource.state.partialNext(state);
    });

  beforeEach(async () => {
    const client = await getTestClientWithUser({ id: 'test-user' });
    searchSource = new UserSearchSource(client);
    searchSource.state.partialNext({
      hasNext: true,
      isLoading: false,
      items: [{ id: 'u1' }],
    });
  });

  it('renders "Searching for…" while the next page loads', () => {
    searchSource.state.partialNext({ isLoading: true });

    renderFooter();

    expect(screen.getByTestId(SEARCH_LOADING_TEST_ID)).toHaveTextContent(
      'Searching for users...',
    );
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  describe('first page', () => {
    it('renders "Searching for…" while the first page loads', () => {
      searchSource.state.partialNext({ isLoading: true, items: undefined });

      renderFooter();

      expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toHaveTextContent(
        'Searching for users...',
      );
    });

    it('renders ListFirstPageLoadingUI while the first page loads', () => {
      const ListFirstPageLoadingUI = vi.fn(() => <div>Custom first page</div>);
      const ListLoadingNextPageUI = vi.fn(() => null);
      searchSource.state.partialNext({ isLoading: true, items: undefined });

      renderFooter({ ListFirstPageLoadingUI, ListLoadingNextPageUI });

      expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toHaveTextContent(
        'Custom first page',
      );
      expect(ListLoadingNextPageUI).not.toHaveBeenCalled();
    });

    it('renders the deprecated SearchSourceResultsLoadingIndicator instead while set', () => {
      const ListFirstPageLoadingUI = vi.fn(() => null);
      searchSource.state.partialNext({ isLoading: true, items: undefined });

      renderFooter({
        ListFirstPageLoadingUI,
        SearchSourceResultsLoadingIndicator: () => <div>Deprecated loading</div>,
      });

      expect(screen.getByText('Deprecated loading')).toBeInTheDocument();
      expect(ListFirstPageLoadingUI).not.toHaveBeenCalled();
    });

    it('renders no loading state when the deprecated SearchSourceResultsLoadingIndicator is null', () => {
      const ListFirstPageLoadingUI = vi.fn(() => <div>Custom first page</div>);
      searchSource.state.partialNext({ isLoading: true, items: undefined });

      renderFooter({
        ListFirstPageLoadingUI,
        // Apps turn the state off with `null`, which the key's type does not name.
        SearchSourceResultsLoadingIndicator: null as unknown as undefined,
      });

      expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toBeEmptyDOMElement();
      expect(ListFirstPageLoadingUI).not.toHaveBeenCalled();
    });
  });

  it('renders "All results loaded" when hasNext is false', () => {
    searchSource.state.partialNext({ hasNext: false });

    renderFooter();

    expect(screen.getByText('All results loaded')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId(SEARCH_LOADING_TEST_ID)).not.toBeInTheDocument();
  });

  it('does not render "All results loaded" while a page loads', () => {
    searchSource.state.partialNext({ hasNext: false, isLoading: true });

    renderFooter();

    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  it('renders only the footer wrapper when not loading and has more results', () => {
    renderFooter();

    expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toBeEmptyDOMElement();
  });

  it('passes the bottom edge to the shared indicators', () => {
    const ListEndReachedUI = vi.fn(() => null);
    const ListLoadingNextPageUI = vi.fn(() => null);
    searchSource.state.partialNext({ hasNext: false });

    renderFooter({ ListEndReachedUI, ListLoadingNextPageUI });

    expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
      isLoading: false,
      position: 'bottom',
    });
    expect(ListEndReachedUI.mock.lastCall?.[0]).toEqual({
      hasEnded: true,
      reached: 'bottom',
    });

    setSourceState({ hasNext: true, isLoading: true });

    expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
      isLoading: true,
      position: 'bottom',
    });
    expect(ListEndReachedUI.mock.lastCall?.[0]).toEqual({
      hasEnded: false,
      reached: 'bottom',
    });
  });

  it('ignores the deprecated EndReachedIndicator, which only the channel list reads', () => {
    const EndReachedIndicator = vi.fn(() => null);
    searchSource.state.partialNext({ hasNext: false });

    renderFooter({ EndReachedIndicator });

    expect(EndReachedIndicator).not.toHaveBeenCalled();
    expect(screen.getByText('All results loaded')).toBeInTheDocument();
  });

  it('renders the deprecated SearchSourceResultsLoadingIndicator instead of ListLoadingNextPageUI while set', () => {
    const ListLoadingNextPageUI = vi.fn(() => null);
    searchSource.state.partialNext({ isLoading: true });

    renderFooter({
      ListLoadingNextPageUI,
      SearchSourceResultsLoadingIndicator: () => (
        <div data-testid='custom-loading-indicator'>Custom Loading...</div>
      ),
    });

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(ListLoadingNextPageUI).not.toHaveBeenCalled();
  });

  it('renders no next-page loading state when the deprecated SearchSourceResultsLoadingIndicator is null', () => {
    const ListLoadingNextPageUI = vi.fn(() => <div>Custom next page</div>);
    searchSource.state.partialNext({ isLoading: true });

    renderFooter({
      ListLoadingNextPageUI,
      // Apps turn the state off with `null`, which the key's type does not name.
      SearchSourceResultsLoadingIndicator: null as unknown as undefined,
    });

    expect(ListLoadingNextPageUI).not.toHaveBeenCalled();
    expect(screen.getByTestId('search-footer')).toBeEmptyDOMElement();
  });

  it('translates "All results loaded" message', () => {
    const mockTranslate = vi.fn(
      (key: any, defaultValue?: any) => `Translated ${defaultValue ?? key}`,
    );
    searchSource.state.partialNext({ hasNext: false });

    renderFooter({}, mockTranslate as never);

    expect(mockTranslate).toHaveBeenCalledWith(
      'common.resultsLoaded.label',
      'All results loaded',
    );
    expect(screen.getByText('Translated All results loaded')).toBeInTheDocument();
  });

  it('handles state updates correctly', () => {
    renderFooter();

    setSourceState({ hasNext: false });
    expect(screen.getByText('All results loaded')).toBeInTheDocument();

    setSourceState({ hasNext: true, isLoading: true });
    expect(screen.getByTestId(SEARCH_LOADING_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });
});
