import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SearchResults } from '../SearchResults';

import { ChatProvider } from '../../../context/ChatContext';

import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

const SEARCH_RESULT_LIST_SELECTOR = '.str-chat__channel-search-result-list';

async function createClientWithChannel(empty = false) {
  const user1 = generateUser();
  const user2 = generateUser();
  const mockedChannel = generateChannel({
    data: { image: 'image-xxx', name: 'channel-xxx' },
    members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    messages: empty
      ? []
      : ' '
          .repeat(20)
          .split(' ')
          .map((v, i) => generateMessage({ user: i % 3 ? user1 : user2 })),
  });
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.id);
  await channel.watch();

  return { channel, client };
}

const renderComponent = (props = {}, chatContext = { themeVersion: '2' }) =>
  render(
    <ChatProvider value={chatContext}>
      <SearchResults {...props} />
    </ChatProvider>,
  );

describe('SearchResults', () => {
  describe.each([['1'], ['2']])('version %s', (themeVersion) => {
    it('should render loading indicator', () => {
      renderComponent({ searching: true }, { themeVersion });
      expect(screen.queryByTestId('search-in-progress-indicator')).toBeInTheDocument();
    });

    it('should not render loading indicator if search not in progress', () => {
      renderComponent({ results: [] }, { themeVersion });
      expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
    });

    it('should render custom loading indicator if search in progress', () => {
      const SearchLoading = () => <div>CustomSearchLoading</div>;
      renderComponent({ searching: true, SearchLoading }, { themeVersion });
      expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
      expect(screen.queryByText('CustomSearchLoading')).toBeInTheDocument();
    });

    it('should not render custom loading indicator if search not in progress', () => {
      const SearchLoading = () => <div>CustomSearchLoading</div>;
      renderComponent({ results: [], SearchLoading }, { themeVersion });
      expect(screen.queryByTestId('search-in-progress-indicator')).not.toBeInTheDocument();
      expect(screen.queryByText('CustomSearchLoading')).not.toBeInTheDocument();
    });

    it('should render empty search result indicator', () => {
      renderComponent({ results: [] }, { themeVersion });
      expect(screen.queryByText('No results found')).toBeInTheDocument();
    });

    it('should render custom empty search result indicator', () => {
      const SearchEmpty = () => <div>CustomSearchEmpty</div>;
      renderComponent({ results: [], SearchEmpty }, { themeVersion });
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
      expect(screen.queryByText('CustomSearchEmpty')).toBeInTheDocument();
    });
    it('should render search results header', () => {
      renderComponent({ results: [generateChannel()] }, { themeVersion });
      expect(screen.queryByTestId('channel-search-results-header')).toBeInTheDocument();
    });
    it('should render custom search results header', () => {
      const SearchResultsHeader = () => <div>CustomSearchResultsHeader</div>;
      renderComponent({ results: [generateChannel()], SearchResultsHeader }, { themeVersion });
      expect(screen.queryByText('CustomSearchResultsHeader')).toBeInTheDocument();
    });
    it(`should render channel search result`, async () => {
      const { channel, client } = await createClientWithChannel();
      renderComponent({ results: [channel] }, { client, themeVersion });
      expect(
        screen.queryByTestId(
          themeVersion === '1' ? 'channel-search-result-channel' : 'channel-preview-button',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId(
          themeVersion === '1' ? 'channel-preview-button' : 'channel-search-result-channel',
        ),
      ).not.toBeInTheDocument();
    });
    it(`should render non-channel search result`, async () => {
      const user = generateUser();
      const { client } = await createClientWithChannel();
      renderComponent({ results: [user] }, { client, themeVersion });
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
      expect(searchResultList.children[1]).toHaveClass('focused');
    });

    it('should add class "inline" to the results list root by default', () => {
      const { container } = renderComponent({ results: [] }, { themeVersion });
      const searchResultList = container.querySelector(SEARCH_RESULT_LIST_SELECTOR);
      expect(searchResultList).toHaveClass('inline');
    });

    it('should add popup class to the results list root', () => {
      const { container } = renderComponent({ popupResults: true, results: [] }, { themeVersion });
      const searchResultList = container.querySelector(SEARCH_RESULT_LIST_SELECTOR);
      expect(searchResultList).toHaveClass('popup');
    });
  });
});
