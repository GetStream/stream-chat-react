import { screen } from '@testing-library/react';
import React from 'react';
import type { UserSearchSource } from 'stream-chat';

import {
  createdFakeSearchSources,
  createFakeSearchSource,
  type FakeSearchSource,
} from '../../../__tests__/fakeSearchSource';
import {
  itShowsTheFirstPageLoadError,
  listStateOverrides,
  queryNextPageLoadingIndicator,
  renderChannelDetailView,
  setSearchSourceState,
} from '../../../__tests__/listStateTestUtils';
import { ChannelMembersAddView } from '../ChannelMembersAddView';
import { ChannelMembersBrowseView } from '../ChannelMembersBrowseView';
import type { ChannelMembersModeController } from '../ChannelMembersView';
import { createChannel } from './testUtils';

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();
  const { createFakeSearchSourceClass } =
    await import('../../../__tests__/fakeSearchSource');
  return {
    ...actual,
    ChannelMemberSearchSource: createFakeSearchSourceClass('members'),
  };
});

vi.mock('react-virtuoso', () => import('../../../__tests__/virtuosoStub'));

const member = { user: { id: 'user-2', name: 'Bob' }, user_id: 'user-2' };

describe('ChannelMembersBrowseView list states', () => {
  const renderBrowseView = (
    overrides?: Parameters<typeof renderChannelDetailView>[1]['overrides'],
  ) => {
    const result = renderChannelDetailView(<ChannelMembersBrowseView />, {
      // No members in the channel state, so the list has none to show until a page loads.
      channel: createChannel({ members: {} }),
      overrides,
    });
    const source = createdFakeSearchSources.at(-1) as FakeSearchSource;
    return { ...result, source };
  };

  beforeEach(() => {
    createdFakeSearchSources.length = 0;
  });

  itShowsTheFirstPageLoadError(renderBrowseView, member);

  it('shows the empty state whenever it has no members to show, also while a page loads', () => {
    const { source } = renderBrowseView();
    setSearchSourceState(source, { isLoading: true });

    expect(screen.getByText('No member found')).toBeInTheDocument();
  });

  it('shows the channel state members while the first page loads', () => {
    renderChannelDetailView(<ChannelMembersBrowseView />, { channel: createChannel() });
    setSearchSourceState(createdFakeSearchSources.at(-1) as FakeSearchSource, {
      isLoading: true,
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('keeps showing the channel state members when the first page failed', () => {
    renderChannelDetailView(<ChannelMembersBrowseView />, { channel: createChannel() });
    setSearchSourceState(createdFakeSearchSources.at(-1) as FakeSearchSource, {
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('Request failed with status code 500'),
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load the list")).not.toBeInTheDocument();
  });

  it('shows the error, not the channel state members, when a typed search query failed', () => {
    renderChannelDetailView(<ChannelMembersBrowseView />, { channel: createChannel() });
    setSearchSourceState(createdFakeSearchSources.at(-1) as FakeSearchSource, {
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('Request failed with status code 500'),
      searchQuery: 'xyz',
    });

    expect(screen.getByText("Couldn't load the list")).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows the next page loading below the members', () => {
    const { container, source } = renderBrowseView();
    setSearchSourceState(source, { hasNext: true, isLoading: true, items: [member] });

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(queryNextPageLoadingIndicator(container)).toBeInTheDocument();
  });

  it('shows the empty state once a loaded page has no members', () => {
    const { source } = renderBrowseView();
    setSearchSourceState(source, { items: [] });

    expect(screen.getByText('No member found')).toBeInTheDocument();
  });

  it('renders the app overrides of the shared keys', () => {
    const { source } = renderBrowseView(listStateOverrides);

    setSearchSourceState(source, { isLoading: true, items: [member] });
    expect(screen.getByTestId('app-next-page-loading')).toBeInTheDocument();

    setSearchSourceState(source, { isLoading: false, items: [] });
    expect(screen.getByTestId('app-empty')).toBeInTheDocument();
  });
});

describe('ChannelMembersAddView list states', () => {
  const modeController = {
    mode: 'add',
    setMode: vi.fn(),
  } as unknown as ChannelMembersModeController;

  const renderAddView = (
    overrides?: Parameters<typeof renderChannelDetailView>[1]['overrides'],
  ) => {
    const source = createFakeSearchSource('users');
    const result = renderChannelDetailView(
      <ChannelMembersAddView
        modeController={modeController}
        searchSource={source as unknown as UserSearchSource}
      />,
      { channel: createChannel(), overrides },
    );
    return { ...result, source };
  };

  itShowsTheFirstPageLoadError(renderAddView, { id: 'user-3', name: 'Cara' });

  it('shows no empty state while the first page loads', () => {
    const { source } = renderAddView();
    setSearchSourceState(source, { isLoading: true });

    expect(screen.queryByText('No user found')).not.toBeInTheDocument();
  });

  it('shows the next page loading below the users', () => {
    const { container, source } = renderAddView();
    setSearchSourceState(source, {
      hasNext: true,
      isLoading: true,
      items: [{ id: 'user-2', name: 'Bob' }],
    });

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(queryNextPageLoadingIndicator(container)).toBeInTheDocument();
  });

  it('shows the empty state once a loaded page has no users', () => {
    const { source } = renderAddView();
    setSearchSourceState(source, { items: [] });

    expect(screen.getByText('No user found')).toBeInTheDocument();
  });

  it('renders the app ListEmptyUI', () => {
    const { source } = renderAddView(listStateOverrides);
    setSearchSourceState(source, { items: [] });

    expect(screen.getByTestId('app-empty')).toBeInTheDocument();
  });
});
