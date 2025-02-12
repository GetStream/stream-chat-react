import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { LoadMoreButton } from '../LoadMoreButton';
import { TranslationProvider } from '../../../context';
import { mockTranslationContext } from '../../../mock-builders';

describe('LoadMoreButton', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { container } = render(
      <TranslationProvider value={mockTranslationContext}>
        <LoadMoreButton isLoading={false} onClick={() => null} />
      </TranslationProvider>,
    );
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__load-more-button"
        >
          <button
            aria-label="Load More Channels"
            class="str-chat__load-more-button__button str-chat__cta-button"
            data-testid="load-more-button"
          >
            Load more
          </button>
        </div>
      </div>
    `);
  });

  it('should trigger onClick function when clicked', () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <LoadMoreButton isLoading={false} onClick={onClickMock} />,
    );

    fireEvent.click(getByTestId('load-more-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and show loading indicator when refreshing is true', () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <LoadMoreButton isLoading={true} onClick={onClickMock} />,
    );
    fireEvent.click(getByTestId('load-more-button'));
    expect(onClickMock).not.toHaveBeenCalledTimes(1);
    const loadingIndicator = getByTestId('load-more-button').querySelector(
      '.str-chat__loading-indicator',
    );
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('deprecates prop refreshing in favor of queryInProgress', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => null);
    const onClickMock = jest.fn();

    const { getByTestId } = render(
      <LoadMoreButton isLoading={false} onClick={onClickMock} refreshing={true} />,
    );

    fireEvent.click(getByTestId('load-more-button'));
    const loadingIndicator = getByTestId('load-more-button').querySelector(
      '.str-chat__loading-indicator',
    );

    consoleWarnSpy.mockRestore();
    expect(loadingIndicator).not.toBeInTheDocument();
  });

  it('should display children', () => {
    const { getByText } = render(
      <LoadMoreButton isLoading={true} onClick={() => null}>
        Test Button
      </LoadMoreButton>,
    );
    waitFor(() => {
      expect(getByText('Test Button')).toBeInTheDocument();
    });
  });
});
