import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import type { ChannelMemberResponse } from 'stream-chat';

import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelMembersBrowseView } from '../ChannelMembersBrowseView';
import { createChannel, emitChannelEvent, renderWithChannel } from './testUtils';

const mocks = vi.hoisted(() => ({
  searchSourceActivate: vi.fn(),
  searchSourceCancelScheduledQuery: vi.fn(),
  searchSourceOptions: [] as unknown[],
  searchSourceResetState: vi.fn(),
  searchSourceSearch: vi.fn(),
  virtuosoRenderCount: 0,
}));

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();

  class ChannelMemberSearchSource {
    state = {};

    constructor(_channel: unknown, options: unknown) {
      mocks.searchSourceOptions.push(options);
    }

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

// Render react-virtuoso synchronously: jsdom has no layout, so the real
// component would window down to zero items. The stub renders every item plus
// the empty/footer slots so behavior assertions still hold.
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    components = {},
    data = [],
    itemContent,
  }: {
    components?: {
      EmptyPlaceholder?: React.ComponentType;
      Footer?: React.ComponentType;
    };
    data?: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
  }) => {
    mocks.virtuosoRenderCount += 1;
    const { EmptyPlaceholder, Footer } = components;
    return (
      <div data-testid='virtuoso'>
        {data.length === 0
          ? EmptyPlaceholder && <EmptyPlaceholder />
          : data.map((item, index) => (
              <React.Fragment key={index}>{itemContent(index, item)}</React.Fragment>
            ))}
        {Footer && <Footer />}
      </div>
    );
  },
}));

vi.mock('../../../../../components/Dialog', () => ({
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

describe('ChannelMembersBrowseView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.virtuosoRenderCount = 0;
    mocks.searchSourceOptions.length = 0;

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

    vi.mocked(useComponentContext).mockReturnValue(
      {} as ReturnType<typeof useComponentContext>,
    );

    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      members,
    });
  });

  it('renders browse-only rows', () => {
    renderWithChannel(<ChannelMembersBrowseView />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
    expect(
      document.querySelector('.str-chat__channel-detail__channel-members-view__checkbox'),
    ).not.toBeInTheDocument();
  });

  it('keeps current results while a new member search query is loading', () => {
    renderWithChannel(<ChannelMembersBrowseView />);

    expect(mocks.searchSourceOptions[0]).toMatchObject({
      allowEmptySearchString: true,
      pageSize: 100,
      resetOnNewSearchQuery: false,
    });
  });

  it('searches members with the trimmed query', () => {
    renderWithChannel(<ChannelMembersBrowseView />);

    const searchInput = screen.getByRole('searchbox', { name: 'Search' });
    fireEvent.change(searchInput, { target: { value: '  ali  ' } });

    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('ali');
  });

  it('does not re-render member results while typing before source state changes', () => {
    renderWithChannel(<ChannelMembersBrowseView />);

    const renderCount = mocks.virtuosoRenderCount;
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'ali' },
    });

    expect(mocks.virtuosoRenderCount).toBe(renderCount);
  });

  it('activates the members list once the channel gains its first member', () => {
    const channel = createChannel({ memberCount: 0, members: {} });

    renderWithChannel(<ChannelMembersBrowseView />, channel);

    // No members yet: the search input is suppressed and nothing is queried.
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(mocks.searchSourceSearch).not.toHaveBeenCalled();

    // A member joins; the count is tracked reactively, so the list activates
    // without a remount.
    channel.data!.member_count = 1;
    channel.state.members['user-1'] = {
      user: { id: 'user-1', name: 'Alice' },
      user_id: 'user-1',
    };
    emitChannelEvent(channel, 'member.added');

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(mocks.searchSourceActivate).toHaveBeenCalled();
    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
  });

  it('falls back to channel state members when the search source has no items', () => {
    vi.mocked(useStateStore).mockReturnValue({
      isLoading: false,
      members: null,
    });

    renderWithChannel(<ChannelMembersBrowseView />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
