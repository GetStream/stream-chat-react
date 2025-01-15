import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { SearchResultsHeader } from '../SearchResults';
import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

jest.mock('../SearchContext');
jest.mock('../../../context');
jest.mock('../../../store');

describe('SearchResultsHeader', () => {
  const mockSearchController = {
    activateSource: jest.fn(),
    deactivateSource: jest.fn(),
    searchSourceTypes: ['users', 'channels', 'messages'],
    state: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useSearchContext.mockReturnValue({
      searchController: mockSearchController,
    });

    useTranslationContext.mockReturnValue({
      t: (key) => key,
    });

    useStateStore.mockReturnValue({
      activeSourceTypes: ['users', 'messages'],
    });
  });

  it('renders filter source buttons for each source type', () => {
    render(<SearchResultsHeader />);
    expect(
      screen.getAllByRole('button', {
        name: 'aria/Search results header filter button',
      }),
    ).toHaveLength(3);
  });

  it('applies active class to active source type buttons', () => {
    render(<SearchResultsHeader />);

    const buttons = screen.getAllByRole('button');

    buttons.forEach((button) => {
      const buttonClasses = button.className;
      if (
        button.textContent === 'search-results-header-filter-source-button-label--users' ||
        button.textContent === 'search-results-header-filter-source-button-label--messages'
      ) {
        expect(buttonClasses).toContain(
          'str-chat__search-results-header__filter-source-button--active',
        );
      } else {
        expect(buttonClasses).not.toContain(
          'str-chat__search-results-header__filter-source-button--active',
        );
      }
    });
  });

  it('deactivates source when clicking active source button', () => {
    render(<SearchResultsHeader />);

    const usersButton = screen.getByText('search-results-header-filter-source-button-label--users');
    fireEvent.click(usersButton);

    expect(mockSearchController.deactivateSource).toHaveBeenCalledWith('users');
    expect(mockSearchController.activateSource).not.toHaveBeenCalled();
  });

  it('activates source when clicking inactive source button', () => {
    render(<SearchResultsHeader />);

    const channelsButton = screen.getByText(
      'search-results-header-filter-source-button-label--channels',
    );
    fireEvent.click(channelsButton);

    expect(mockSearchController.activateSource).toHaveBeenCalledWith('channels');
    expect(mockSearchController.deactivateSource).not.toHaveBeenCalled();
  });

  it('translates button labels correctly', () => {
    const mockTranslate = jest.fn((key) => `Translated ${key}`);
    useTranslationContext.mockReturnValue({ t: mockTranslate });

    render(<SearchResultsHeader />);

    expect(mockTranslate).toHaveBeenCalledWith('aria/Search results header filter button');
    mockSearchController.searchSourceTypes.forEach((sourceType) => {
      expect(mockTranslate).toHaveBeenCalledWith(
        `search-results-header-filter-source-button-label--${sourceType}`,
      );
    });
  });

  it('handles state updates correctly', () => {
    const { rerender } = render(<SearchResultsHeader />);

    // Update active sources
    useStateStore.mockReturnValue({
      activeSourceTypes: ['channels'],
    });

    rerender(<SearchResultsHeader />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const buttonClasses = button.className;
      if (button.textContent === 'search-results-header-filter-source-button-label--channels') {
        expect(buttonClasses).toContain(
          'str-chat__search-results-header__filter-source-button--active',
        );
      } else {
        expect(buttonClasses).not.toContain(
          'str-chat__search-results-header__filter-source-button--active',
        );
      }
    });
  });
});
