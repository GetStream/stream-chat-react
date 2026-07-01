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
    containerRef: { current: null },
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

  it('spreads inputProps onto the input (merging className) without overriding controlled props', () => {
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        inputProps: {
          autoComplete: 'off',
          className: 'custom-input',
          'data-1p-ignore': true,
          // A controlled prop the SDK owns — must NOT win over the component's own value.
          type: 'password',
        },
      }),
    );

    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    // Integrator-supplied, non-conflicting props land on the element.
    expect(input).toHaveAttribute('data-1p-ignore', 'true');
    expect(input).toHaveAttribute('autocomplete', 'off');
    // className is merged, not replaced.
    expect(input).toHaveClass('str-chat__search-bar__input');
    expect(input).toHaveClass('custom-input');
    // The SDK's controlled prop wins.
    expect(input).toHaveAttribute('type', 'text');
  });

  it('still handles input changes when inputProps are provided', () => {
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        inputProps: { 'data-1p-ignore': true },
      }),
    );

    render(<SearchBar />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'hi' } });

    expect(mockSearchController.search).toHaveBeenCalledWith('hi');
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

  it('does not exit on blur when exitSearchOnInputBlur is false (default)', () => {
    const containerRef = { current: null as HTMLElement | null };
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({ ...defaultProps, containerRef }),
    );
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: 'test' });

    render(<SearchBar />);
    containerRef.current = screen.getByTestId('search-bar');

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fireEvent.blur(screen.getByTestId('search-input'), { relatedTarget: outside });

    expect(mockSearchController.exit).not.toHaveBeenCalled();
    outside.remove();
  });

  it('exits search on blur when focus leaves the search widget, regardless of query text', () => {
    const containerRef = { current: null as HTMLElement | null };
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        containerRef,
        exitSearchOnInputBlur: true,
      }),
    );
    // a query is present — the old `!currentTarget.value` guard would have suppressed the exit here
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: 'test' });

    render(<SearchBar />);
    containerRef.current = screen.getByTestId('search-bar');

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    fireEvent.blur(screen.getByTestId('search-input'), { relatedTarget: outside });

    expect(mockSearchController.exit).toHaveBeenCalledWith();
    outside.remove();
  });

  it('exits search on blur to a non-focusable target outside the widget (relatedTarget null)', () => {
    const containerRef = { current: null as HTMLElement | null };
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        containerRef,
        exitSearchOnInputBlur: true,
      }),
    );
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: 'test' });

    render(<SearchBar />);
    containerRef.current = screen.getByTestId('search-bar');

    fireEvent.blur(screen.getByTestId('search-input'), { relatedTarget: null });

    expect(mockSearchController.exit).toHaveBeenCalledWith();
  });

  it('does not exit search on blur when a non-focusable element inside the widget is pressed (relatedTarget null after in-widget pointerdown)', () => {
    const containerRef = { current: null as HTMLElement | null };
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        containerRef,
        exitSearchOnInputBlur: true,
      }),
    );
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: 'test' });

    render(<SearchBar />);
    const bar = screen.getByTestId('search-bar');
    containerRef.current = bar;

    // Pressing a non-focusable descendant (e.g. the search icon) blurs the input with a null
    // relatedTarget; the preceding pointerdown was inside, so search must stay open.
    fireEvent.pointerDown(bar);
    fireEvent.blur(screen.getByTestId('search-input'), { relatedTarget: null });

    expect(mockSearchController.exit).not.toHaveBeenCalled();
  });

  it('does not exit search on blur when focus moves to a control within the widget (e.g. Cancel)', () => {
    const containerRef = { current: null as HTMLElement | null };
    vi.mocked(useSearchContext).mockReturnValue(
      fromPartial<SearchContextValue>({
        ...defaultProps,
        containerRef,
        exitSearchOnInputBlur: true,
      }),
    );
    vi.mocked(useStateStore).mockReturnValue({ isActive: true, searchQuery: '' });

    render(<SearchBar />);
    // the container encloses the bar's controls (Cancel/clear), mirroring the real DOM
    containerRef.current = screen.getByTestId('search-bar');

    // focus moving TO the Cancel button (inside the widget) must not collapse search — it exits
    // only on the button's own activation (WCAG 3.2.1)
    fireEvent.blur(screen.getByTestId('search-input'), {
      relatedTarget: screen.getByTestId('search-bar-button'),
    });

    expect(mockSearchController.exit).not.toHaveBeenCalled();
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
