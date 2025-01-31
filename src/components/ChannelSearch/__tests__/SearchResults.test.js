import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SearchResults } from '../SearchResults';

import { ChatProvider } from '../../../context/ChatContext';

import {
  createClientWithChannel,
  generateChannel,
  generateUser,
} from '../../../mock-builders';

const SEARCH_RESULT_LIST_SELECTOR = '.str-chat__channel-search-result-list';

const renderComponent = (props = {}, chatContext = {}) =>
  render(
    <ChatProvider value={chatContext}>
      <SearchResults {...props} />
    </ChatProvider>,
  );

describe('SearchResults', () => {
  it('should render loading indicator', () => {
    renderComponent({ searching: true });
    expect(screen.queryByTestId('search-in-progress-indicator')).toBeInTheDocument();
  });

  it('should not render loading indicator if search not in progress', () => {
    renderComponent({ results: [] });
    expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
  });

  it('should render custom loading indicator if search in progress', () => {
    const SearchLoading = () => <div>CustomSearchLoading</div>;
    renderComponent({ searching: true, SearchLoading });
    expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
    expect(screen.queryByText('CustomSearchLoading')).toBeInTheDocument();
  });

  it('should not render custom loading indicator if search not in progress', () => {
    const SearchLoading = () => <div>CustomSearchLoading</div>;
    renderComponent({ results: [], SearchLoading });
    expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
    expect(screen.queryByText('CustomSearchLoading')).not.toBeInTheDocument();
  });

  it('should render empty search result indicator', () => {
    renderComponent({ results: [] });
    expect(screen.queryByText('No results found')).toBeInTheDocument();
  });

  it('should render custom empty search result indicator', () => {
    const SearchEmpty = () => <div>CustomSearchEmpty</div>;
    renderComponent({ results: [], SearchEmpty });
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    expect(screen.queryByText('CustomSearchEmpty')).toBeInTheDocument();
  });
  it('should render search results header', () => {
    renderComponent({ results: [generateChannel()] });
    expect(screen.queryByTestId('channel-search-results-header')).toBeInTheDocument();
  });
  it('should render custom search results header', () => {
    const SearchResultsHeader = () => <div>CustomSearchResultsHeader</div>;
    renderComponent({ results: [generateChannel()], SearchResultsHeader });
    expect(screen.queryByText('CustomSearchResultsHeader')).toBeInTheDocument();
  });
  it(`should render channel search result`, async () => {
    const { channel, client } = await createClientWithChannel();
    renderComponent({ results: [channel] }, { client });
    expect(screen.queryByTestId('channel-preview-button')).toBeInTheDocument();
    expect(screen.queryByTestId('channel-search-result-channel')).not.toBeInTheDocument();
  });
  it(`should render non-channel search result`, async () => {
    const user = generateUser();
    const { client } = await createClientWithChannel();
    renderComponent({ results: [user] }, { client });
    expect(screen.queryByTestId('channel-search-result-user')).toBeInTheDocument();
  });
  it('should render custom search results list', () => {
    const SearchResultsList = () => <div>CustomSearchResultsList</div>;
    renderComponent({ results: [generateChannel()], SearchResultsList });
    expect(screen.queryByText('CustomSearchResultsList')).toBeInTheDocument();
  });
  it('should render custom search results items', () => {
    const SearchResultItem = () => <div>CustomSearchResultItem</div>;
    renderComponent({ results: [generateChannel()], SearchResultItem });
    expect(screen.queryByText('CustomSearchResultItem')).toBeInTheDocument();
  });

  it('should allow to navigate results with arrow keys', async () => {
    const { channel, client } = await createClientWithChannel();
    const { container } = renderComponent({ results: [channel] }, { client });
    const searchResultList = container.querySelector(SEARCH_RESULT_LIST_SELECTOR);
    searchResultList.focus();
    await act(() => {
      fireEvent.keyDown(searchResultList, { key: 'ArrowDown' });
    });
    await act(() => {
      fireEvent.keyDown(searchResultList, { key: 'ArrowDown' });
    });
    expect(searchResultList.children[1].lastChild).toHaveClass(
      'str-chat__channel-search-result--focused',
    );
  });

  it('should add class "inline" to the results list root by default', () => {
    const { container } = renderComponent({ results: [] });
    const searchResultList = container.querySelector(SEARCH_RESULT_LIST_SELECTOR);
    expect(searchResultList).toHaveClass('inline');
  });

  it('should add popup class to the results list root', () => {
    const { container } = renderComponent({ popupResults: true, results: [] });
    const searchResultList = container.querySelector(SEARCH_RESULT_LIST_SELECTOR);
    expect(searchResultList).toHaveClass('popup');
  });
});
