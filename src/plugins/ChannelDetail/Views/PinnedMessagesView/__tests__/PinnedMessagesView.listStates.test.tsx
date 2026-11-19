import { screen } from '@testing-library/react';
import React from 'react';
import { StateStore } from '@stream-io/state-store';
import type { Channel, MessageSearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { createFakeSearchSource } from '../../../__tests__/fakeSearchSource';
import {
  itShowsTheFirstPageLoadError,
  listStateOverrides,
  queryNextPageLoadingIndicator,
  renderChannelDetailView,
  setSearchSourceState,
} from '../../../__tests__/listStateTestUtils';
import { PinnedMessagesView } from '../PinnedMessagesView';

vi.mock('react-virtuoso', () => import('../../../__tests__/virtuosoStub'));

const pinnedMessage = {
  created_at: '2026-01-01T15:53:00.000Z',
  id: 'message-1',
  text: 'Pinned hello',
  user: { id: 'user-1', name: 'Alice' },
};

const createPinnedChannel = (pinnedCount: number) =>
  fromPartial<Channel>({
    cid: 'messaging:test-channel',
    pinnedMessagesPaginator: {
      state: new StateStore({
        items: Array.from({ length: pinnedCount }, (_, i) => ({ id: `pinned-${i}` })),
      }),
    },
  });

const renderPinnedView = ({
  overrides,
  pinnedCount = 1,
}: {
  overrides?: Parameters<typeof renderChannelDetailView>[1]['overrides'];
  pinnedCount?: number;
} = {}) => {
  const source = createFakeSearchSource('messages');
  const result = renderChannelDetailView(
    <PinnedMessagesView
      layout='tabs'
      searchSource={source as unknown as MessageSearchSource}
    />,
    { channel: createPinnedChannel(pinnedCount), overrides },
  );
  return { ...result, source };
};

describe('PinnedMessagesView list states', () => {
  itShowsTheFirstPageLoadError(
    (overrides) => renderPinnedView({ overrides }),
    pinnedMessage,
  );

  it('shows "No pinned messages", not the error, once the channel has no pinned messages', () => {
    const { source } = renderPinnedView({ pinnedCount: 0 });
    setSearchSourceState(source, {
      isLoading: false,
      items: [],
      lastQueryError: new Error('Request failed with status code 500'),
    });

    expect(screen.getByText('No pinned messages')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
  });

  it('shows no empty state while the first page loads', () => {
    const { source } = renderPinnedView();
    setSearchSourceState(source, { isLoading: true });

    expect(screen.queryByText('No messages found')).not.toBeInTheDocument();
    expect(screen.queryByText('No pinned messages')).not.toBeInTheDocument();
  });

  it('shows the next page loading below the messages', () => {
    const { container, source } = renderPinnedView();
    setSearchSourceState(source, {
      hasNext: true,
      isLoading: true,
      items: [pinnedMessage],
    });

    expect(screen.getByText('Pinned hello')).toBeInTheDocument();
    expect(queryNextPageLoadingIndicator(container)).toBeInTheDocument();
  });

  it('shows "No messages found" once a search of the pinned messages found none', () => {
    const { source } = renderPinnedView();
    setSearchSourceState(source, { items: [], searchQuery: 'nothing' });

    expect(screen.getByText('No messages found')).toBeInTheDocument();
  });

  it('shows "No pinned messages" for a channel without pinned messages, without querying', () => {
    const { source } = renderPinnedView({ pinnedCount: 0 });

    expect(screen.getByText('No pinned messages')).toBeInTheDocument();
    expect(source.search).not.toHaveBeenCalled();
  });

  it('renders the app overrides of the shared keys', () => {
    const { source } = renderPinnedView({ overrides: listStateOverrides });

    setSearchSourceState(source, {
      hasNext: true,
      isLoading: true,
      items: [pinnedMessage],
    });
    expect(screen.getByTestId('app-next-page-loading')).toBeInTheDocument();

    setSearchSourceState(source, { isLoading: false, items: [] });
    expect(screen.getByTestId('app-empty')).toBeInTheDocument();
  });
});
