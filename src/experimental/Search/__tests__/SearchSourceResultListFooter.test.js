import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SearchSourceResultListFooter } from '../SearchResults';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../SearchSourceResultsContext');
jest.mock('../../../context');
jest.mock('../../../store');

const SEARCH_FOOTER_TEST_ID = 'search-footer';

describe('SearchSourceResultListFooter', () => {
  const mockSearchSource = {
    state: {},
  };

  const DefaultLoadingIndicator = () => (
    <div data-testid='default-loading-indicator'>Loading...</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();

    useSearchSourceResultsContext.mockReturnValue({
      searchSource: mockSearchSource,
    });

    useComponentContext.mockReturnValue({
      SearchSourceResultsLoadingIndicator: DefaultLoadingIndicator,
    });

    useTranslationContext.mockReturnValue({
      t: (key) => key,
    });

    useStateStore.mockReturnValue({
      hasNext: true,
      isLoading: false,
    });
  });

  it('renders loading indicator when isLoading is true', () => {
    useStateStore.mockReturnValue({
      hasNext: true,
      isLoading: true,
    });

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId('default-loading-indicator')).toBeInTheDocument();
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  it('renders "All results loaded" message when hasNext is false', () => {
    useStateStore.mockReturnValue({
      hasNext: false,
      isLoading: false,
    });

    render(<SearchSourceResultListFooter />);

    expect(screen.getByText('All results loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
  });

  it('renders only the footer wrapper when not loading and has more results', () => {
    useStateStore.mockReturnValue({
      hasNext: true,
      isLoading: false,
    });

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  it('uses custom loading indicator when provided', () => {
    const CustomLoadingIndicator = () => (
      <div data-testid='custom-loading-indicator'>Custom Loading...</div>
    );

    useComponentContext.mockReturnValue({
      SearchSourceResultsLoadingIndicator: CustomLoadingIndicator,
    });

    useStateStore.mockReturnValue({
      hasNext: true,
      isLoading: true,
    });

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
  });

  it('translates "All results loaded" message', () => {
    const mockTranslate = jest.fn((key) => `Translated ${key}`);
    useTranslationContext.mockReturnValue({ t: mockTranslate });

    useStateStore.mockReturnValue({
      hasNext: false,
      isLoading: false,
    });

    render(<SearchSourceResultListFooter />);

    expect(mockTranslate).toHaveBeenCalledWith('All results loaded');
    expect(screen.getByText('Translated All results loaded')).toBeInTheDocument();
  });

  it('handles state updates correctly', () => {
    const { rerender } = render(<SearchSourceResultListFooter />);

    useStateStore.mockReturnValue({
      hasNext: false,
      isLoading: false,
    });

    rerender(<SearchSourceResultListFooter />);
    expect(screen.getByText('All results loaded')).toBeInTheDocument();

    useStateStore.mockReturnValue({
      hasNext: true,
      isLoading: true,
    });

    rerender(<SearchSourceResultListFooter />);
    expect(screen.getByTestId('default-loading-indicator')).toBeInTheDocument();
  });
});
