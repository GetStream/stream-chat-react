import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import { useTranslationContext } from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelMembersViewList } from '../ChannelMembersViewList';
import { createChannel, getSelectableMemberButton, renderWithChannel } from './testUtils';

const mocks = vi.hoisted(() => ({
  paginatorCancelScheduledQuery: vi.fn(),
  paginatorNext: vi.fn(),
}));

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();

  class ChannelMembersPaginator {
    filters: unknown;
    state = {};

    next = mocks.paginatorNext;

    cancelScheduledQuery = mocks.paginatorCancelScheduledQuery;
  }

  return {
    ...actual,
    ChannelMembersPaginator,
  };
});

vi.mock('lodash.debounce', () => ({
  default: (fn: (...args: unknown[]) => unknown) => {
    const debounced = (...args: unknown[]) => fn(...args);
    vi.spyOn(debounced, 'cancel').mockImplementation();
    return debounced;
  },
}));

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
    channel_role: 'admin',
    created_at: '2026-01-01T00:00:00.000000000Z',
    updated_at: '2026-01-01T00:00:00.000000000Z',
    user: { id: 'user-2', name: 'Bob' },
    user_id: 'user-2',
  },
];

describe('ChannelMembersViewList', () => {
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

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      members,
    });
  });

  it('renders browse-only rows when removeMembers is disabled', () => {
    renderWithChannel(<ChannelMembersViewList />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
    expect(
      document.querySelector('.str-chat__channel-detail__channel-members-view__checkbox'),
    ).not.toBeInTheDocument();
  });

  it('shows selectable rows and remove footer when removeMembers and permission are granted', async () => {
    const channel = createChannel({ ownCapabilities: ['update-channel-members'] });

    renderWithChannel(
      <ChannelMembersViewList onMembersRemoved={onMembersRemoved} removeMembers />,
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
      <ChannelMembersViewList onMembersRemoved={onMembersRemoved} removeMembers />,
      channel,
    );

    mocks.paginatorNext.mockClear();

    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: 'ali' } });

    expect(searchInput).toHaveValue('ali');

    fireEvent.click(getSelectableMemberButton('Alice'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove {{ count }} members:1' }));

    await waitFor(() => {
      expect(channel.removeMembers).toHaveBeenCalledWith(['user-1']);
      expect(searchInput).toHaveValue('');
      expect(mocks.paginatorNext).toHaveBeenCalled();
    });
  });

  it('does not show selection UI when removeMembers is enabled without permission', () => {
    renderWithChannel(
      <ChannelMembersViewList onMembersRemoved={onMembersRemoved} removeMembers />,
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

  it('falls back to channel state members when paginator has no items', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      members: null,
    });

    renderWithChannel(<ChannelMembersViewList />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
