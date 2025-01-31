import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { Search } from '../Search';
// import { useSearchContext } from '../SearchContext';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import { useStateStore } from '../../../store';

// jest.mock('../SearchContext');
jest.mock('../../../context');
jest.mock('../../../store');

const SEARCH_TEST_ID = 'search';
const SEARCH_BAR_TEST_ID = 'search-bar';
const SEARCH_RESULTS_ARIA_LABEL = 'aria/Search results';

const CustomSearchBar = () => (
  <div data-testid='custom-search-bar'>Custom Search Bar</div>
);
const CustomSearchResults = () => (
  <div data-testid='custom-search-results'>Custom Results</div>
);

describe('Search', () => {
  const mockSearchController = {
    state: {},
  };

  const defaultProps = {
    directMessagingChannelType: 'messaging',
    disabled: false,
    exitSearchOnInputBlur: true,
    placeholder: 'Search',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useComponentContext.mockReturnValue({
      SearchResultsHeader: jest.fn(),
    });

    useTranslationContext.mockReturnValue({
      t: (key) => key,
    });

    useChatContext.mockReturnValue({
      searchController: mockSearchController,
    });

    useStateStore.mockReturnValue({
      activeSources: [],
      isActive: true,
      searchSourceTypes: [],
      sources: [],
    });
  });

  it('renders search container with default built-in components', () => {
    render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SEARCH_BAR_TEST_ID)).toBeInTheDocument();
    expect(screen.getByLabelText(SEARCH_RESULTS_ARIA_LABEL)).toBeInTheDocument();
  });

  it('uses components from context when provided', () => {
    useComponentContext.mockReturnValue({
      SearchBar: CustomSearchBar,
      SearchResults: CustomSearchResults,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId('custom-search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('custom-search-results')).toBeInTheDocument();
    expect(screen.queryByTestId(SEARCH_BAR_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(SEARCH_RESULTS_ARIA_LABEL)).not.toBeInTheDocument();
  });

  it('applies active class when search is active', () => {
    useStateStore.mockReturnValue({
      ...useStateStore(),
      isActive: true,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).toHaveClass('str-chat__search--active');
  });

  it('does not apply active class when search is inactive', () => {
    useStateStore.mockReturnValue({
      ...useStateStore(),
      isActive: false,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).not.toHaveClass(
      'str-chat__search--active',
    );
  });

  it('provides search context to children', () => {
    const ContextConsumer = () => {
      const context = React.useContext(
        jest.requireActual('../SearchContext').SearchContext,
      );
      return <div data-testid='context-consumer'>{context.placeholder}</div>;
    };

    const CustomSearchBar = () => (
      <div data-testid='custom-search-bar'>
        <ContextConsumer />
      </div>
    );

    useComponentContext.mockReturnValue({
      SearchBar: CustomSearchBar,
      SearchResults: CustomSearchResults,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId('context-consumer')).toHaveTextContent('Search');
  });

  it('passes all props through context', () => {
    const customProps = {
      ...defaultProps,
      disabled: true,
      exitSearchOnInputBlur: false,
      placeholder: 'Custom placeholder',
    };

    const ContextConsumer = () => {
      const context = React.useContext(
        jest.requireActual('../SearchContext').SearchContext,
      );
      return (
        <div data-testid='context-consumer'>
          <div data-testid='disabled'>{String(context.disabled)}</div>
          <div data-testid='exit-on-blur'>{String(context.exitSearchOnInputBlur)}</div>
          <div data-testid='placeholder'>{context.placeholder}</div>
        </div>
      );
    };

    const CustomSearchBar = () => (
      <div data-testid='custom-search-bar'>
        <ContextConsumer />
      </div>
    );

    useComponentContext.mockReturnValue({
      SearchBar: CustomSearchBar,
      SearchResults: CustomSearchResults,
    });

    render(<Search {...customProps} />);

    expect(screen.getByTestId('disabled')).toHaveTextContent('true');
    expect(screen.getByTestId('exit-on-blur')).toHaveTextContent('false');
    expect(screen.getByTestId('placeholder')).toHaveTextContent('Custom placeholder');
  });

  it('handles state updates correctly', () => {
    useComponentContext.mockReturnValue({
      SearchBar: CustomSearchBar,
      SearchResults: CustomSearchResults,
    });
    useStateStore.mockReturnValue({
      isActive: false,
    });

    const { rerender } = render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).not.toHaveClass(
      'str-chat__search--active',
    );

    useStateStore.mockReturnValue({
      isActive: true,
    });

    rerender(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).toHaveClass('str-chat__search--active');
  });

  it('uses default directMessagingChannelType when not provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { directMessagingChannelType, ...propsWithoutChannelType } = defaultProps;

    const ContextConsumer = () => {
      const context = React.useContext(
        jest.requireActual('../SearchContext').SearchContext,
      );
      return <div data-testid='channel-type'>{context.directMessagingChannelType}</div>;
    };
    const SearchBar = () => <ContextConsumer />;
    useComponentContext.mockReturnValue({
      SearchBar,
      SearchResults: CustomSearchResults,
    });

    render(<Search {...propsWithoutChannelType} />);

    expect(screen.getByTestId('channel-type')).toHaveTextContent('messaging');
  });
});
