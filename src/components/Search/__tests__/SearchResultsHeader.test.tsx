import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SearchResultsHeader } from '../SearchResults';
import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { mockT } from '../../../mock-builders/translator';

vi.mock('../SearchContext');
vi.mock('../../../context');
vi.mock('../../../store');

describe('SearchResultsHeader', () => {
  const mockSources = {
    channels: { items: [], search: vi.fn(), state: {}, type: 'channels' },
    messages: { items: ['message1'], search: vi.fn(), state: {}, type: 'messages' },
    users: { items: [], search: vi.fn(), state: {}, type: 'users' },
  };

  const mockSearchController = {
    activateSource: vi.fn(),
    deactivateSource: vi.fn(),
    searchQuery: 'test query',
    get sources() {
      return Object.entries(mockSources).map(([type, source]) => ({
        type,
        ...source,
      }));
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock sources
    Object.values(mockSources).forEach((source) => {
      source.items = source.type === 'messages' ? ['message1'] : [];
      source.search.mockClear();
    });

    useSearchContext['mockReturnValue']({
      searchController: mockSearchController,
    });

    useTranslationContext['mockReturnValue']({
      t: mockT,
    });

    useStateStore['mockReturnValue']({ isActive: false });
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

      expect(screen.getByText('channels')).toBeInTheDocument();
      expect(screen.getByText('messages')).toBeInTheDocument();
      expect(screen.getByText('users')).toBeInTheDocument();
    });

    it('applies correct aria-labels to all buttons', () => {
      render(<SearchResultsHeader />);
      const buttons = screen.getAllByRole('button');
      // Each button names its own source, interpolated into the shared label.
      ['channels', 'messages', 'users'].forEach((source, index) => {
        expect(buttons[index]).toHaveAttribute(
          'aria-label',
          `Search results header filter button for: ${source}`,
        );
      });
    });
  });

  describe('button states and styling', () => {
    it('applies active class to button when source is active', () => {
      useStateStore['mockReturnValue']({ isActive: true });
      render(<SearchResultsHeader />);

      const label = screen.getByText('messages');
      const button = label.closest('button');
      expect(button).toHaveClass(
        'str-chat__search-results-header__filter-source-button--active',
      );
    });

    it('does not apply active class when source is inactive', () => {
      useStateStore['mockReturnValue']({ isActive: false });
      render(<SearchResultsHeader />);

      const label = screen.getByText('messages');
      const button = label.closest('button');
      expect(button).not.toHaveClass(
        'str-chat__search-results-header__filter-source-button--active',
      );
    });
  });

  describe('button interactions', () => {
    it('deactivates source when clicking active source button', () => {
      Object.values(mockSources).forEach((source) => {
        if (source.type !== 'messages') return;
        source['isActive'] = true;
      });
      render(<SearchResultsHeader />);

      fireEvent.click(screen.getByText('messages'));
      expect(mockSearchController.deactivateSource).toHaveBeenCalledWith('messages');
      expect(mockSearchController.activateSource).not.toHaveBeenCalled();

      Object.values(mockSources).forEach((source) => {
        if (source.type !== 'messages') return;
        source['isActive'] = undefined;
      });
    });

    it('activates and searches source with no items', () => {
      render(<SearchResultsHeader />);
      fireEvent.click(screen.getByText('channels'));

      expect(mockSearchController.activateSource).toHaveBeenCalledWith('channels');
      expect(mockSources.channels.search).toHaveBeenCalledWith('test query');
    });

    it('only performs search upon activation if it does not have items loaded', () => {
      render(<SearchResultsHeader />);
      fireEvent.click(screen.getByText('messages'));

      expect(mockSearchController.activateSource).toHaveBeenCalledWith('messages');
      expect(mockSources.messages.search).not.toHaveBeenCalled();
    });

    it('does not perform search upon activation if it search query is empty', () => {
      mockSearchController.searchQuery = '';
      render(<SearchResultsHeader />);

      fireEvent.click(screen.getByText('channels'));
      expect(mockSearchController.activateSource).toHaveBeenCalledWith('channels');
      expect(mockSources.channels.search).not.toHaveBeenCalled();
    });
  });
});
