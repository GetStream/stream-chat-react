import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, SearchSourceState } from 'stream-chat';

import { ChatProvider, WithComponents } from '../../../context';
import type { ComponentContextValue } from '../../../context';
import { mockChatContext } from '../../../mock-builders';
import { ChannelDetailProvider } from '../ChannelDetailContext';
import type { FakeSearchSource } from './fakeSearchSource';

/** Renders a channel detail view inside the providers it reads, with app component overrides. */
export const renderChannelDetailView = (
  ui: React.ReactElement,
  {
    channel,
    overrides = {},
  }: { channel: Channel; overrides?: Partial<ComponentContextValue> },
) =>
  render(
    <ChatProvider value={mockChatContext({ client: fromPartial({}), mutes: [] })}>
      <WithComponents overrides={overrides}>
        <ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>
      </WithComponents>
    </ChatProvider>,
  );

export const setSearchSourceState = (
  source: FakeSearchSource,
  state: Partial<SearchSourceState>,
) => act(() => source.state.partialNext(state));

export const queryNextPageLoadingIndicator = (container: HTMLElement) =>
  container.querySelector(
    '.str-chat__loading-indicator-placeholder .str-chat__loading-indicator',
  );

/** Overrides of the shared list-state keys, each rendering a test id. */
export const listStateOverrides: Partial<ComponentContextValue> = {
  ListEmptyUI: () => <div data-testid='app-empty' />,
  ListLoadingNextPageUI: ({ isLoading }) =>
    isLoading ? <div data-testid='app-next-page-loading' /> : null,
};

/**
 * Registers the failed-first-page tests of a channel detail view: `renderView` renders the view
 * and returns its search source, `loadedItem` is one item of a loaded page.
 */
export const itShowsTheFirstPageLoadError = (
  renderView: (overrides?: Partial<ComponentContextValue>) => {
    source: FakeSearchSource;
  },
  loadedItem: unknown,
) => {
  const failedFirstPage = {
    isLoading: false,
    items: [],
    lastQueryError: new Error('Request failed with status code 500'),
  };

  it('shows ListLoadErrorUI in place of the list when the first page failed', () => {
    const { source } = renderView();
    setSearchSourceState(source, failedFirstPage);

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows ListLoadErrorUI when a failed new search query left no items', () => {
    const { source } = renderView();
    setSearchSourceState(source, { ...failedFirstPage, items: undefined });

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
  });

  it('starts the source over with the current search query on Try again', () => {
    const { source } = renderView();
    setSearchSourceState(source, { ...failedFirstPage, searchQuery: 'bo' });

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(source.executeQuery).toHaveBeenCalledWith('bo');
    // `resetState` deactivates the source, and an inactive source does not query.
    const callOrder = [
      source.cancelScheduledQuery,
      source.resetState,
      source.activate,
      source.executeQuery,
    ].map((spy) => spy.mock.invocationCallOrder.at(-1) ?? 0);
    expect(callOrder).toEqual([...callOrder].sort((a, b) => a - b));
    expect(Math.min(...callOrder)).toBeGreaterThan(0);
  });

  it('keeps the loaded items when a later page fails', () => {
    const { source } = renderView();
    setSearchSourceState(source, { ...failedFirstPage, items: [loadedItem] });

    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
  });

  it('renders the app’s ListLoadErrorUI', () => {
    const { source } = renderView({
      ListLoadErrorUI: ({ retry }) => (
        <button data-testid='app-load-error' onClick={retry} type='button' />
      ),
    });
    setSearchSourceState(source, failedFirstPage);

    expect(screen.getByTestId('app-load-error')).toBeInTheDocument();
  });
};
