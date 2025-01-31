import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SearchResults } from '../SearchResults';
import { useSearchContext } from '../SearchContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../SearchContext');
jest.mock('../../../context');
jest.mock('../../../store');

const SOURCE_RESULTS_TEST_ID = 'default-source-results';
const SEARCH_RESULTS_HEADER_TEST_ID = 'default-header';
const PRESEARCH_TEST_ID = 'default-presearch';
const SEARCH_RESULTS_ARIA_LABEL = 'aria/Search results';
describe('SearchResults', () => {
  const mockSearchSource = {
    isActive: true,
    items: [
      { id: 'user1', name: 'User 1' },
      { id: 'user2', name: 'User 2' },
    ],
    type: 'users',
  };

  const mockSearchController = {
    state: {
      isActive: true,
      searchQuery: '',
      sources: [mockSearchSource],
    },
  };

  const DefaultSearchResultsHeader = () => (
    <div data-testid={SEARCH_RESULTS_HEADER_TEST_ID}>Header</div>
  );
  const DefaultSearchSourceResults = ({ searchSource }) => (
    <div data-testid={SOURCE_RESULTS_TEST_ID}>Results for {searchSource.type}</div>
  );
  const DefaultSearchResultsPresearch = ({ activeSources }) => (
    <div data-testid={PRESEARCH_TEST_ID}>
      Presearch with {activeSources.length} sources
    </div>
  );

  beforeEach(() => {
    jest.clearAllMocks();

    useSearchContext.mockReturnValue({
      searchController: mockSearchController,
    });

    useComponentContext.mockReturnValue({
      SearchResultsHeader: DefaultSearchResultsHeader,
      SearchResultsPresearch: DefaultSearchResultsPresearch,
      SearchSourceResults: DefaultSearchSourceResults,
    });

    useTranslationContext.mockReturnValue({
      t: (key) => key,
    });

    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: '',
    });
  });

  it('renders nothing when search is not active', () => {
    useStateStore.mockReturnValue({
      activeSources: [],
      isActive: false,
      searchQuery: '',
    });

    render(<SearchResults />);

    expect(screen.queryByLabelText(SEARCH_RESULTS_ARIA_LABEL)).not.toBeInTheDocument();
  });

  it('renders search results container with header when active', () => {
    render(<SearchResults />);

    expect(screen.getByLabelText(SEARCH_RESULTS_ARIA_LABEL)).toBeInTheDocument();
    expect(screen.getByTestId(SEARCH_RESULTS_HEADER_TEST_ID)).toBeInTheDocument();
  });

  it('renders presearch when no search query is present', () => {
    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: '',
    });

    render(<SearchResults />);

    expect(screen.getByTestId(PRESEARCH_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(SOURCE_RESULTS_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders source results when search query is present', () => {
    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchResults />);

    expect(screen.getByTestId(SOURCE_RESULTS_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId(PRESEARCH_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders multiple source results', () => {
    const mockSources = [
      { isActive: true, items: [], type: 'users' },
      { isActive: true, items: [], type: 'channels' },
    ];

    useStateStore.mockReturnValue({
      activeSources: mockSources,
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchResults />);

    expect(screen.getAllByTestId(SOURCE_RESULTS_TEST_ID)).toHaveLength(2);
  });

  it('uses custom components when provided', () => {
    const CustomHeader = () => <div data-testid='custom-header'>Custom Header</div>;
    const CustomSourceResults = () => (
      <div data-testid='custom-source-results'>Custom Results</div>
    );
    const CustomPresearch = () => (
      <div data-testid='custom-presearch'>Custom Presearch</div>
    );

    useComponentContext.mockReturnValue({
      SearchResultsHeader: CustomHeader,
      SearchResultsPresearch: CustomPresearch,
      SearchSourceResults: CustomSourceResults,
    });

    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: '',
    });

    render(<SearchResults />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-presearch')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<SearchResults />);

    expect(screen.getByLabelText(SEARCH_RESULTS_ARIA_LABEL)).toHaveClass(
      'str-chat__search-results',
    );
  });

  it('passes correct props to SearchResultsPresearch', () => {
    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: '',
    });

    render(<SearchResults />);

    const presearchElement = screen.getByTestId(PRESEARCH_TEST_ID);
    expect(presearchElement).toHaveTextContent('Presearch with 1 sources');
  });

  it('passes correct props to SearchSourceResults', () => {
    useStateStore.mockReturnValue({
      activeSources: [mockSearchSource],
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchResults />);

    const sourceResults = screen.getByTestId(SOURCE_RESULTS_TEST_ID);
    expect(sourceResults).toHaveTextContent('Results for users');
  });
});
