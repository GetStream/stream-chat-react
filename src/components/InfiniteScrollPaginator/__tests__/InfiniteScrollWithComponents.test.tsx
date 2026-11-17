import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import type { PaginatorState } from 'stream-chat';

import { InfiniteScrollWithComponents } from '../InfiniteScrollWithComponents';

type Item = { cid: string; id: string; name: string };

const Nothing = () => null;

const renderList = (
  state: StateStore<PaginatorState<Item>>,
  getItemId?: (item: Item) => string,
) =>
  render(
    <InfiniteScrollWithComponents<Item>
      EmptyListIndicator={Nothing}
      EndReachedIndicator={Nothing}
      FirstPageLoadingIndicator={Nothing}
      ListItem={({ item }) => <div data-testid='row'>{item.name}</div>}
      LoadingNextPageIndicator={Nothing}
      paginator={{ getItemId, hasMoreHead: false, hasMoreTail: false, state }}
    />,
  );

describe('InfiniteScrollWithComponents', () => {
  // Channel ids are unique only per type (`team:general` and `livestream:general`), so a channel
  // list keyed by `id` shared keys between rows and React rendered ghost rows on reorder.
  it('keys rows by the paginator item id, so rows sharing an `id` render once each', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const teamGeneral = { cid: 'team:general', id: 'general', name: 'team' };
    const liveGeneral = { cid: 'livestream:general', id: 'general', name: 'livestream' };
    const other = { cid: 'messaging:other', id: 'other', name: 'other' };
    const state = new StateStore<PaginatorState<Item>>({
      hasMoreHead: false,
      hasMoreTail: false,
      isLoading: false,
      items: [teamGeneral, liveGeneral, other],
    } as PaginatorState<Item>);

    renderList(state, (item) => item.cid);
    act(() => {
      state.partialNext({ items: [other, liveGeneral, teamGeneral] });
    });

    expect(screen.getAllByTestId('row').map((row) => row.textContent)).toEqual([
      'other',
      'livestream',
      'team',
    ]);
    // React's argument count for this warning varies by version, so only the message is matched.
    expect(
      consoleError.mock.calls.some(
        ([message]) => typeof message === 'string' && message.includes('same key'),
      ),
    ).toBe(false);
    consoleError.mockRestore();
  });

  it('falls back to `id` when the paginator has no item id', () => {
    const state = new StateStore<PaginatorState<Item>>({
      hasMoreHead: false,
      hasMoreTail: false,
      isLoading: false,
      items: [{ cid: 'a:1', id: '1', name: 'one' }],
    } as PaginatorState<Item>);

    renderList(state);

    expect(screen.getAllByTestId('row').map((row) => row.textContent)).toEqual(['one']);
  });
});
