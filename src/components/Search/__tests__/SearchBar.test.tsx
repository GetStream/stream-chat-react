import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { SearchBar } from '../SearchBar';
import { useSearchContext } from '../SearchContext';
import type { SearchContextValue } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import type { TranslationContextValue } from '../../../context';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { axe } from '../../../../axe-helper';

const { announceInteraction } = vi.hoisted(() => ({ announceInteraction: vi.fn() }));

// Mock the hooks
vi.mock('../SearchContext');
vi.mock('../../../context');
vi.mock('../../../store');
vi.mock('../hooks', () => ({
  useSearchQueriesInProgress: vi.fn().mockReturnValue([]),
}));
vi.mock('../../Accessibility', () => ({
  useInteractionAnnouncements: () => ({ announceInteraction }),
}));

const INPUT_TEST_ID = 'search-input';
const CLEAR_SEARCH_BUTTON_ARIA_LABEL = 'aria/Clear search';
const SEARCH_INPUT_ACCESSIBLE_NAME = 'Search';

describe('SearchBar', () => {
  const mockSearchController = {
    activate: vi.fn(),
    clear: vi.fn(),
    exit: vi.fn(),
    search: vi.fn(),
    state: { value: { isActive: false, searchQuery: '' } },
  };

  const defaultProps = {
    disabled: false,
    exitSearchOnInputBlur: false,
    filterButtonsContainerRef: { current: null },
    placeholder: 'Custom placeholder',
    searchController: mockSearchController,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>(defaultProps),
    );
    vi.mocked(useTranslationContext).mockReturnValue(
      fromPartial<TranslationContextValue>({ t: (key: any) => key }),
    );
    vi.mocked(useStateStore).mockReturnValue({
      isActive: false,
      searchQuery: '',
    });
  });

  it('renders with default state', () => {
    render(<SearchBar />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.queryByTestId('clear-input-button')).not.toBeInTheDocument();
  });

  it('gives the search input an accessible name', () => {
    render(<SearchBar />);

    expect(
      screen.getByRole('textbox', { name: SEARCH_INPUT_ACCESSIBLE_NAME }),
    ).toBeInTheDocument();
  });

  it('shows placeholder text', () => {
    render(<SearchBar />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('shows default placeholder when none provided', () => {
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        placeholder: undefined,
      }),
    );

    render(<SearchBar />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockSearchController.search).toHaveBeenCalledWith('test');
  });

  it('does not activate search merely on focus (WCAG 3.2.1)', () => {
    render(<SearchBar />);

    fireEvent.focus(screen.getByTestId('search-input'));

    expect(mockSearchController.activate).not.toHaveBeenCalled();
  });

  it('activates search on typing, not on focus', () => {
    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    expect(mockSearchController.activate).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'a' } });
    expect(mockSearchController.activate).toHaveBeenCalledTimes(1);
    expect(mockSearchController.search).toHaveBeenCalledWith('a');
  });

  it('clears search when input is emptied', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockSearchController.clear).toHaveBeenCalledWith();
  });

  it('shows clear button when there is a search query', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    expect(screen.getByTestId('clear-input-button')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: CLEAR_SEARCH_BUTTON_ARIA_LABEL }),
    ).toBeInTheDocument();
  });

  it('handles clear button click', () => {
    const state = {
      isActive: true,
      searchQuery: 'test',
    };
    vi.mocked(useStateStore).mockReturnValue(state);

    render(<SearchBar />);
    expect(screen.getByTestId(INPUT_TEST_ID)).toHaveValue(state.searchQuery);
    fireEvent.click(screen.getByTestId('clear-input-button'));

    expect(mockSearchController.clear).toHaveBeenCalledWith();
  });

  it('announces that the search was cleared via the clear button', () => {
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: 'test' });

    render(<SearchBar />);
    fireEvent.click(screen.getByTestId('clear-input-button'));

    expect(announceInteraction).toHaveBeenCalledWith('search.cleared');
  });

  it('shows cancel button when search is active', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
      searchQuery: '',
    });

    render(<SearchBar />);

    expect(screen.getByTestId('search-bar-button')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles cancel button click and returns focus to the input', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
      searchQuery: '',
    });

    render(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-bar-button'));

    expect(mockSearchController.exit).toHaveBeenCalledWith();
    expect(screen.getByTestId(INPUT_TEST_ID)).toHaveFocus();
  });

  it('handles escape key press', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSearchController.exit).toHaveBeenCalledWith();
    expect(screen.getByTestId(INPUT_TEST_ID)).toHaveFocus();
  });

  it('handles blur when exitSearchOnInputBlur is true', () => {
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        exitSearchOnInputBlur: true,
      }),
    );

    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(mockSearchController.exit).toHaveBeenCalledWith();
  });

  it('disables input when disabled prop is true', () => {
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        disabled: true,
      }),
    );

    render(<SearchBar />);

    expect(screen.getByTestId('search-input')).toBeDisabled();
  });

  it('disables clear button during queries in progress', () => {
    const { rerender } = render(<SearchBar />);

    // Mock queries in progress
    vi.mocked(useSearchQueriesInProgress).mockReturnValue(['users']);

    vi.mocked(useStateStore).mockReturnValue({
      input: null,
      isActive: true,
      searchQuery: 'test',
    });

    rerender(<SearchBar />);

    expect(screen.getByTestId('clear-input-button')).toBeDisabled();
  });

  it('passes accessibility checks', async () => {
    const { container } = render(<SearchBar />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
