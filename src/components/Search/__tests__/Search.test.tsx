import { render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';

import { Search } from '../Search';
// import { useSearchContext } from '../SearchContext';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import type {
  ChatContextValue,
  ComponentContextValue,
  TranslationContextValue,
} from '../../../context';
import { useStateStore } from '../../../store';
import type { SearchContextValue } from '../SearchContext';

// vi.mock('../SearchContext');
vi.mock('../../../context');
vi.mock('../../../store');

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
    vi.clearAllMocks();

    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchResultsHeader: vi.fn(),
      }),
    );

    vi.mocked(useTranslationContext).mockReturnValue(
      fromPartial<TranslationContextValue>({
        t: (key) => key,
      }),
    );

    vi.mocked(useChatContext).mockReturnValue(
      fromPartial<ChatContextValue>({
        searchController: mockSearchController,
      }),
    );

    vi.mocked(useStateStore).mockReturnValue({
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
    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchBar: CustomSearchBar,
        SearchResults: CustomSearchResults,
      }),
    );

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId('custom-search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('custom-search-results')).toBeInTheDocument();
    expect(screen.queryByTestId(SEARCH_BAR_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(SEARCH_RESULTS_ARIA_LABEL)).not.toBeInTheDocument();
  });

  it('applies active class when search is active', () => {
    vi.mocked(useStateStore).mockReturnValue({
      ...vi.mocked(useStateStore)(undefined!, undefined!),
      isActive: true,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).toHaveClass('str-chat__search--active');
  });

  it('does not apply active class when search is inactive', () => {
    vi.mocked(useStateStore).mockReturnValue({
      ...vi.mocked(useStateStore)(undefined!, undefined!),
      isActive: false,
    });

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).not.toHaveClass(
      'str-chat__search--active',
    );
  });

  it('provides search context to children', async () => {
    const { SearchContext } = await vi.importActual('../SearchContext');
    const ContextConsumer = () => {
      const context = React.useContext(
        SearchContext as React.Context<SearchContextValue | undefined>,
      );
      return <div data-testid='context-consumer'>{context?.placeholder}</div>;
    };

    const CustomSearchBar = () => (
      <div data-testid='custom-search-bar'>
        <ContextConsumer />
      </div>
    );

    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchBar: CustomSearchBar,
        SearchResults: CustomSearchResults,
      }),
    );

    render(<Search {...defaultProps} />);

    expect(screen.getByTestId('context-consumer')).toHaveTextContent('Search');
  });

  it('passes all props through context', async () => {
    const customProps = {
      ...defaultProps,
      disabled: true,
      exitSearchOnInputBlur: false,
      placeholder: 'Custom placeholder',
    };

    const { SearchContext } = await vi.importActual('../SearchContext');
    const ContextConsumer = () => {
      const context = React.useContext(
        SearchContext as React.Context<SearchContextValue | undefined>,
      );
      return (
        <div data-testid='context-consumer'>
          <div data-testid='disabled'>{String(context?.disabled)}</div>
          <div data-testid='exit-on-blur'>{String(context?.exitSearchOnInputBlur)}</div>
          <div data-testid='placeholder'>{context?.placeholder}</div>
        </div>
      );
    };

    const CustomSearchBar = () => (
      <div data-testid='custom-search-bar'>
        <ContextConsumer />
      </div>
    );

    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchBar: CustomSearchBar,
        SearchResults: CustomSearchResults,
      }),
    );

    render(<Search {...customProps} />);

    expect(screen.getByTestId('disabled')).toHaveTextContent('true');
    expect(screen.getByTestId('exit-on-blur')).toHaveTextContent('false');
    expect(screen.getByTestId('placeholder')).toHaveTextContent('Custom placeholder');
  });

  it('handles state updates correctly', () => {
    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchBar: CustomSearchBar,
        SearchResults: CustomSearchResults,
      }),
    );
    vi.mocked(useStateStore).mockReturnValue({
      isActive: false,
    });

    const { rerender } = render(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).not.toHaveClass(
      'str-chat__search--active',
    );

    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
    });

    rerender(<Search {...defaultProps} />);

    expect(screen.getByTestId(SEARCH_TEST_ID)).toHaveClass('str-chat__search--active');
  });

  it('uses default directMessagingChannelType when not provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { directMessagingChannelType, ...propsWithoutChannelType } = defaultProps;

    const { SearchContext } = await vi.importActual('../SearchContext');
    const ContextConsumer = () => {
      const context = React.useContext(
        SearchContext as React.Context<SearchContextValue | undefined>,
      );
      return <div data-testid='channel-type'>{context?.directMessagingChannelType}</div>;
    };
    const SearchBar = () => <ContextConsumer />;
    vi.mocked(useComponentContext).mockReturnValue(
      fromPartial<ComponentContextValue>({
        SearchBar,
        SearchResults: CustomSearchResults,
      }),
    );

    render(<Search {...propsWithoutChannelType} />);

    expect(screen.getByTestId('channel-type')).toHaveTextContent('messaging');
  });
});
