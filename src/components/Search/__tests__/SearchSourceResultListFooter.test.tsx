import { render, screen } from '@testing-library/react';
import React from 'react';

import { SearchSourceResultListFooter } from '../SearchResults';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

vi.mock('../SearchSourceResultsContext');
vi.mock('../../../context');
vi.mock('../../../store');

const SEARCH_FOOTER_TEST_ID = 'search-footer';

describe('SearchSourceResultListFooter', () => {
  const mockSearchSource = {
    state: {},
  };

  const DefaultLoadingIndicator = () => (
    <div data-testid='default-loading-indicator'>Loading...</div>
  );

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSearchSourceResultsContext).mockReturnValue({
      searchSource: mockSearchSource,
    } as any);

    vi.mocked(useComponentContext).mockReturnValue({
      SearchSourceResultsLoadingIndicator: DefaultLoadingIndicator,
    } as any);

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: any) => key,
    } as any);

    vi.mocked(useStateStore).mockReturnValue({
      hasNext: true,
      isLoading: false,
    } as any);
  });

  it('renders loading indicator when isLoading is true', () => {
    vi.mocked(useStateStore).mockReturnValue({
      hasNext: true,
      isLoading: true,
    } as any);

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId('default-loading-indicator')).toBeInTheDocument();
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  it('renders "All results loaded" message when hasNext is false', () => {
    vi.mocked(useStateStore).mockReturnValue({
      hasNext: false,
      isLoading: false,
    } as any);

    render(<SearchSourceResultListFooter />);

    expect(screen.getByText('All results loaded')).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
  });

  it('renders only the footer wrapper when not loading and has more results', () => {
    vi.mocked(useStateStore).mockReturnValue({
      hasNext: true,
      isLoading: false,
    } as any);

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId(SEARCH_FOOTER_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
    expect(screen.queryByText('All results loaded')).not.toBeInTheDocument();
  });

  it('uses custom loading indicator when provided', () => {
    const CustomLoadingIndicator = () => (
      <div data-testid='custom-loading-indicator'>Custom Loading...</div>
    );

    vi.mocked(useComponentContext).mockReturnValue({
      SearchSourceResultsLoadingIndicator: CustomLoadingIndicator,
    } as any);

    vi.mocked(useStateStore).mockReturnValue({
      hasNext: true,
      isLoading: true,
    } as any);

    render(<SearchSourceResultListFooter />);

    expect(screen.getByTestId('custom-loading-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('default-loading-indicator')).not.toBeInTheDocument();
  });

  it('translates "All results loaded" message', () => {
    const mockTranslate = vi.fn((key: any) => `Translated ${key}`);
    vi.mocked(useTranslationContext).mockReturnValue({ t: mockTranslate } as any);

    vi.mocked(useStateStore).mockReturnValue({
      hasNext: false,
      isLoading: false,
    } as any);

    render(<SearchSourceResultListFooter />);

    expect(mockTranslate).toHaveBeenCalledWith('All results loaded');
    expect(screen.getByText('Translated All results loaded')).toBeInTheDocument();
  });

  it('handles state updates correctly', () => {
    const { rerender } = render(<SearchSourceResultListFooter />);

    vi.mocked(useStateStore).mockReturnValue({
      hasNext: false,
      isLoading: false,
    } as any);

    rerender(<SearchSourceResultListFooter />);
    expect(screen.getByText('All results loaded')).toBeInTheDocument();

    vi.mocked(useStateStore).mockReturnValue({
      hasNext: true,
      isLoading: true,
    } as any);

    rerender(<SearchSourceResultListFooter />);
    expect(screen.getByTestId('default-loading-indicator')).toBeInTheDocument();
  });
});
