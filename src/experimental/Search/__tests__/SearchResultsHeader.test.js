import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SearchResultsHeader } from '../SearchResults';
import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../SearchContext');
jest.mock('../../../context');
jest.mock('../../../store');

describe('SearchResultsHeader', () => {
  const mockSources = {
    channels: { items: [], search: jest.fn(), state: {}, type: 'channels' },
    messages: { items: ['message1'], search: jest.fn(), state: {}, type: 'messages' },
    users: { items: [], search: jest.fn(), state: {}, type: 'users' },
  };

  const mockSearchController = {
    activateSource: jest.fn(),
    deactivateSource: jest.fn(),
    searchQuery: 'test query',
    get sources() {
      return Object.entries(mockSources).map(([type, source]) => ({
        type,
        ...source,
      }));
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock sources
    Object.values(mockSources).forEach((source) => {
      source.items = source.type === 'messages' ? ['message1'] : [];
      source.search.mockClear();
    });

    useSearchContext.mockReturnValue({
      searchController: mockSearchController,
    });

    useTranslationContext.mockReturnValue({
      t: (key) => key,
    });

    useStateStore.mockReturnValue({ isActive: false });
  });

  describe('rendering', () => {
    it('renders container with correct classes and structure', () => {
      render(<SearchResultsHeader />);
      expect(screen.getByTestId('search-results-header')).toHaveClass(
        'str-chat__search-results-header',
      );
      expect(screen.getByTestId('filter-source-buttons')).toHaveClass(
        'str-chat__search-results-header__filter-source-buttons',
      );
    });

    it('renders a button for each source type', () => {
      render(<SearchResultsHeader />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      expect(
        screen.getByText('search-results-header-filter-source-button-label--channels'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('search-results-header-filter-source-button-label--messages'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('search-results-header-filter-source-button-label--users'),
      ).toBeInTheDocument();
    });

    it('applies correct aria-labels to all buttons', () => {
      render(<SearchResultsHeader />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute(
          'aria-label',
          'aria/Search results header filter button',
        );
      });
    });
  });

  describe('button states and styling', () => {
    it('applies active class to button when source is active', () => {
      useStateStore.mockReturnValue({ isActive: true });
      render(<SearchResultsHeader />);

      const button = screen.getByText(
        'search-results-header-filter-source-button-label--messages',
      );
      expect(button).toHaveClass(
        'str-chat__search-results-header__filter-source-button--active',
      );
    });

    it('does not apply active class when source is inactive', () => {
      useStateStore.mockReturnValue({ isActive: false });
      render(<SearchResultsHeader />);

      const button = screen.getByText(
        'search-results-header-filter-source-button-label--messages',
      );
      expect(button).not.toHaveClass(
        'str-chat__search-results-header__filter-source-button--active',
      );
    });
  });

  describe('button interactions', () => {
    it('deactivates source when clicking active source button', () => {
      Object.values(mockSources).forEach((source) => {
        if (source.type !== 'messages') return;
        source.isActive = true;
      });
      render(<SearchResultsHeader />);

      fireEvent.click(
        screen.getByText('search-results-header-filter-source-button-label--messages'),
      );
      expect(mockSearchController.deactivateSource).toHaveBeenCalledWith('messages');
      expect(mockSearchController.activateSource).not.toHaveBeenCalled();

      Object.values(mockSources).forEach((source) => {
        if (source.type !== 'messages') return;
        source.isActive = undefined;
      });
    });

    it('activates and searches source with no items', () => {
      render(<SearchResultsHeader />);
      fireEvent.click(
        screen.getByText('search-results-header-filter-source-button-label--channels'),
      );

      expect(mockSearchController.activateSource).toHaveBeenCalledWith('channels');
      expect(mockSources.channels.search).toHaveBeenCalledWith('test query');
    });

    it('only performs search upon activation if it does not have items loaded', () => {
      render(<SearchResultsHeader />);
      fireEvent.click(
        screen.getByText('search-results-header-filter-source-button-label--messages'),
      );

      expect(mockSearchController.activateSource).toHaveBeenCalledWith('messages');
      expect(mockSources.messages.search).not.toHaveBeenCalled();
    });

    it('does not perform search upon activation if it search query is empty', () => {
      mockSearchController.searchQuery = '';
      render(<SearchResultsHeader />);

      fireEvent.click(
        screen.getByText('search-results-header-filter-source-button-label--channels'),
      );
      expect(mockSearchController.activateSource).toHaveBeenCalledWith('channels');
      expect(mockSources.channels.search).not.toHaveBeenCalled();
    });
  });
});
