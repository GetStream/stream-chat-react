import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SearchBar } from '../SearchBar';
import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

// Mock the hooks
jest.mock('../SearchContext');
jest.mock('../../../context');
jest.mock('../../../store');
jest.mock('../hooks', () => ({
  useSearchQueriesInProgress: jest.fn().mockReturnValue([]),
}));

const INPUT_TEST_ID = 'search-input';

describe('SearchBar', () => {
  const mockSearchController = {
    activate: jest.fn(),
    clear: jest.fn(),
    exit: jest.fn(),
    search: jest.fn(),
    state: { value: { isActive: false, searchQuery: '' } },
  };

  const defaultProps = {
    disabled: false,
    exitSearchOnInputBlur: false,
    placeholder: 'Custom placeholder',
    searchController: mockSearchController,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSearchContext.mockReturnValue(defaultProps);
    useTranslationContext.mockReturnValue({ t: (key) => key });
    useStateStore.mockReturnValue({
      isActive: false,
      searchQuery: '',
    });
  });

  it('renders with default state', () => {
    render(<SearchBar />);

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.queryByTestId('clear-input-button')).not.toBeInTheDocument();
  });

  it('shows placeholder text', () => {
    render(<SearchBar />);

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('shows default placeholder when none provided', () => {
    useSearchContext.mockReturnValue({
      ...defaultProps,
      placeholder: undefined,
    });

    render(<SearchBar />);

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockSearchController.search).toHaveBeenCalledWith('test');
  });

  it('clears search when input is emptied', () => {
    useStateStore.mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockSearchController.clear).toHaveBeenCalledWith();
  });

  it('shows clear button when there is a search query', () => {
    useStateStore.mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    expect(screen.getByTestId('clear-input-button')).toBeInTheDocument();
  });

  it('handles clear button click', () => {
    const state = {
      isActive: true,
      searchQuery: 'test',
    };
    useStateStore.mockReturnValue(state);

    render(<SearchBar />);
    expect(screen.getByTestId(INPUT_TEST_ID)).toHaveValue(state.searchQuery);
    fireEvent.click(screen.getByTestId('clear-input-button'));

    expect(mockSearchController.clear).toHaveBeenCalledWith();
  });

  it('shows cancel button when search is active', () => {
    useStateStore.mockReturnValue({
      isActive: true,
      searchQuery: '',
    });

    render(<SearchBar />);

    expect(screen.getByTestId('search-bar-button')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles cancel button click', () => {
    useStateStore.mockReturnValue({
      isActive: true,
      searchQuery: '',
    });

    render(<SearchBar />);

    fireEvent.click(screen.getByTestId('search-bar-button'));

    expect(mockSearchController.exit).toHaveBeenCalledWith();
  });

  it('handles escape key press', () => {
    useStateStore.mockReturnValue({
      isActive: true,
      searchQuery: 'test',
    });

    render(<SearchBar />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSearchController.exit).toHaveBeenCalledWith();
  });

  it('handles blur when exitSearchOnInputBlur is true', () => {
    useSearchContext.mockReturnValue({
      ...defaultProps,
      exitSearchOnInputBlur: true,
    });

    render(<SearchBar />);

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(mockSearchController.exit).toHaveBeenCalledWith();
  });

  it('disables input when disabled prop is true', () => {
    useSearchContext.mockReturnValue({
      ...defaultProps,
      disabled: true,
    });

    render(<SearchBar />);

    expect(screen.getByTestId('search-input')).toBeDisabled();
  });

  it('disables clear button during queries in progress', () => {
    const { rerender } = render(<SearchBar />);

    // Mock queries in progress
    jest.requireMock('../hooks').useSearchQueriesInProgress.mockReturnValue(['users']);

    useStateStore.mockReturnValue({
      input: null,
      isActive: true,
      searchQuery: 'test',
    });

    rerender(<SearchBar />);

    expect(screen.getByTestId('clear-input-button')).toBeDisabled();
  });
});
