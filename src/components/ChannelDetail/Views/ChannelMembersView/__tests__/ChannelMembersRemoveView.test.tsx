import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import { useChatContext, useTranslationContext } from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelMembersRemoveView } from '../ChannelMembersRemoveView';
import { createChannel, getSelectableMemberButton, renderWithChannel } from './testUtils';

const mocks = vi.hoisted(() => ({
  searchSourceActivate: vi.fn(),
  searchSourceCancelScheduledQuery: vi.fn(),
  searchSourceResetState: vi.fn(),
  searchSourceSearch: vi.fn(),
}));

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();

  class ChannelMemberSearchSource {
    state = {};

    activate = mocks.searchSourceActivate;

    search = mocks.searchSourceSearch;

    resetState = mocks.searchSourceResetState;

    cancelScheduledQuery = mocks.searchSourceCancelScheduledQuery;
  }

  return {
    ...actual,
    ChannelMemberSearchSource,
  };
});

vi.mock('../../../../../context');
vi.mock('../../../../../store');

vi.mock('../../../../InfiniteScrollPaginator/InfiniteScrollPaginator', () => ({
  InfiniteScrollPaginator: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='infinite-scroll-paginator'>{children}</div>
  ),
}));

vi.mock('../../../../Dialog', () => ({
  Prompt: {
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Footer: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
    FooterControls: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    FooterControlsButtonPrimary: (
      props: React.ButtonHTMLAttributes<HTMLButtonElement>,
    ) => <button {...props} />,
  },
}));

const members: ChannelMemberResponse[] = [
  {
    created_at: '2026-01-01T00:00:00.000000000Z',
    updated_at: '2026-01-01T00:00:00.000000000Z',
    user: { id: 'user-1', name: 'Alice' },
    user_id: 'user-1',
  },
  {
    created_at: '2026-01-01T00:00:00.000000000Z',
    updated_at: '2026-01-01T00:00:00.000000000Z',
    user: { id: 'user-2', name: 'Bob' },
    user_id: 'user-2',
  },
];

describe('ChannelMembersRemoveView', () => {
  const onMembersRemoved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { count?: number; timestamp?: string }) => {
        if (options?.count) return `${key}:${options.count}`;
        if (options?.timestamp) return `${key}:${options.timestamp}`;
        return key;
      },
    } as ReturnType<typeof useTranslationContext>);
    vi.mocked(useChatContext).mockReturnValue({
      mutes: [],
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      members,
    });
  });

  it('shows selectable rows and remove footer when permission is granted', async () => {
    const channel = createChannel({ ownCapabilities: ['update-channel-members'] });

    renderWithChannel(
      <ChannelMembersRemoveView onMembersRemoved={onMembersRemoved} />,
      channel,
    );

    fireEvent.click(getSelectableMemberButton('Alice'));

    expect(
      screen.getByRole('button', { name: 'Remove {{ count }} members:1' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove {{ count }} members:1' }));

    await waitFor(() => {
      expect(channel.removeMembers).toHaveBeenCalledWith(['user-1']);
      expect(onMembersRemoved).toHaveBeenCalledWith(1);
    });
  });

  it('resets search input and reloads members after successful removal', async () => {
    const channel = createChannel({ ownCapabilities: ['update-channel-members'] });

    renderWithChannel(
      <ChannelMembersRemoveView onMembersRemoved={onMembersRemoved} />,
      channel,
    );

    mocks.searchSourceSearch.mockClear();

    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: 'ali' } });

    expect(searchInput).toHaveValue('ali');

    fireEvent.click(getSelectableMemberButton('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove {{ count }} members:1' }));

    await waitFor(() => {
      expect(channel.removeMembers).toHaveBeenCalledWith(['user-1']);
      expect(searchInput).toHaveValue('');
      expect(mocks.searchSourceResetState).toHaveBeenCalled();
      expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
    });
  });

  it('falls back to browse rows without permission', () => {
    renderWithChannel(
      <ChannelMembersRemoveView onMembersRemoved={onMembersRemoved} />,
      createChannel({ ownCapabilities: [] }),
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
    expect(
      document.querySelector('.str-chat__channel-detail__channel-members-view__checkbox'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Remove {{ count }} members/ }),
    ).not.toBeInTheDocument();
  });
});
