import React from 'react';
import { render } from '@testing-library/react';

import { ListLoadingNextPageUI } from '..';
import { ComponentProvider, TranslationProvider } from '../../../context';
import type { ComponentContextValue } from '../../../context';
import {
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

const AppLoadingIndicator = () => <div data-testid='app-loading-indicator' />;

const renderDefault = (
  ui: React.ReactElement,
  componentContext: Partial<ComponentContextValue> = {},
) =>
  render(
    <TranslationProvider value={mockTranslationContextValue()}>
      <ComponentProvider value={mockComponentContext(componentContext)}>
        {ui}
      </ComponentProvider>
    </TranslationProvider>,
  );

describe('ListLoadingNextPageUI', () => {
  it('renders nothing while no page loads', () => {
    const { container } = renderDefault(
      <ListLoadingNextPageUI isLoading={false} position='bottom' />,
      { LoadingIndicator: AppLoadingIndicator },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the context LoadingIndicator while a page loads', () => {
    const { container, getByTestId } = renderDefault(
      <ListLoadingNextPageUI isLoading position='top' />,
      { LoadingIndicator: AppLoadingIndicator },
    );
    expect(container.firstChild).toBe(getByTestId('app-loading-indicator'));
  });

  it('renders the default LoadingIndicator when the context sets none', () => {
    const { container } = renderDefault(
      <ListLoadingNextPageUI isLoading position='top' />,
    );
    expect(container.firstChild).toHaveClass('str-chat__loading-indicator');
  });

  it('renders nothing when the LoadingIndicator is null', () => {
    const { container } = renderDefault(
      <ListLoadingNextPageUI isLoading position='top' />,
      { LoadingIndicator: null as unknown as undefined },
    );
    expect(container).toBeEmptyDOMElement();
  });
});
