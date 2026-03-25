import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

import { LoadMoreButton } from '../LoadMoreButton';
import { TranslationProvider } from '../../../context';
import { mockTranslationContextValue } from '../../../mock-builders';

describe('LoadMoreButton', () => {
  afterEach(cleanup);

  it('should render component with default props', () => {
    const { container, getByTestId } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <LoadMoreButton isLoading={false} onClick={() => null} />
      </TranslationProvider>,
    );
    const wrapper = container.querySelector('.str-chat__load-more-button');
    expect(wrapper).toBeInTheDocument();

    const button = getByTestId('load-more-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('str-chat__button');
    expect(button).toHaveAttribute('aria-label', 'Load More Channels');
    expect(button.textContent).toContain('Load more');
  });

  it('should trigger onClick function when clicked', () => {
    const onClickMock = vi.fn();
    const { getByTestId } = render(
      <LoadMoreButton isLoading={false} onClick={onClickMock} />,
    );

    fireEvent.click(getByTestId('load-more-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and show loading indicator when isLoading is true', () => {
    const onClickMock = vi.fn();
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

  it('deprecates prop refreshing in favor of isLoading', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => null);
    const onClickMock = vi.fn();

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
