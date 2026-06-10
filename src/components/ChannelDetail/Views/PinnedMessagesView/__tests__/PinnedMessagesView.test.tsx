import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, LocalMessage } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import {
  useChannelActionContext,
  useChatContext,
  useModalContext,
  useTranslationContext,
} from '../../../../../context';
import { useStateStore } from '../../../../../store';
import { ChannelDetailProvider } from '../../../ChannelDetailContext';
import { PinnedMessagesView } from '../PinnedMessagesView';

const mocks = vi.hoisted(() => ({
  infiniteScrollPaginatorRenderCount: 0,
  searchSourceActivate: vi.fn(),
  searchSourceCancelScheduledQuery: vi.fn(),
  searchSourceFilterBuilderOptions: [] as Array<{
    messageSearch?: {
      initialFilterConfig?: {
        text?: {
          generate: (context: { searchQuery?: string }) => unknown;
        };
      };
    };
  }>,
  searchSourceInstances: [] as Array<{
    messageSearchChannelFilters?: unknown;
    messageSearchFilters?: unknown;
  }>,
  searchSourceOptions: [] as unknown[],
  searchSourceResetState: vi.fn(),
  searchSourceSearch: vi.fn(),
}));

vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();

  class MessageSearchSource {
    messageSearchChannelFilters?: unknown;
    messageSearchFilters?: unknown;
    state = {};

    constructor(_client: unknown, options: unknown, filterBuilderOptions: unknown) {
      mocks.searchSourceOptions.push(options);
      mocks.searchSourceFilterBuilderOptions.push(
        filterBuilderOptions as (typeof mocks.searchSourceFilterBuilderOptions)[number],
      );
      mocks.searchSourceInstances.push(this);
    }

    activate = mocks.searchSourceActivate;

    search = mocks.searchSourceSearch;

    resetState = mocks.searchSourceResetState;

    cancelScheduledQuery = mocks.searchSourceCancelScheduledQuery;
  }

  return {
    ...actual,
    MessageSearchSource,
  };
});

vi.mock('../../../../../context');
vi.mock('../../../../../store');

vi.mock('../../../../InfiniteScrollPaginator/InfiniteScrollPaginator', () => ({
  InfiniteScrollPaginator: ({ children }: { children: React.ReactNode }) => {
    mocks.infiniteScrollPaginatorRenderCount += 1;
    return <div data-testid='infinite-scroll-paginator'>{children}</div>;
  },
}));

vi.mock('../../../../Dialog', () => ({
  Prompt: {
    Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Header: ({
      description,
      title,
    }: {
      description?: React.ReactNode;
      title?: React.ReactNode;
    }) => (
      <header>
        <h2>{title}</h2>
        {description}
      </header>
    ),
  },
}));

const pinnedMessages: LocalMessage[] = [
  fromPartial<LocalMessage>({
    cid: 'messaging:test-channel',
    created_at: new Date('2026-01-01T15:53:00.000Z'),
    id: 'message-1',
    pinned: true,
    text: 'Release timeline: Code freeze March 18',
    type: 'regular',
    updated_at: new Date('2026-01-01T15:53:00.000Z'),
    user: { id: 'user-1', name: 'Alice' },
  }),
  fromPartial<LocalMessage>({
    attachments: [{ title: 'Roadmap.pdf', type: 'file' }],
    cid: 'messaging:test-channel',
    created_at: new Date('2026-01-02T15:53:00.000Z'),
    id: 'message-2',
    pinned: true,
    type: 'regular',
    updated_at: new Date('2026-01-02T15:53:00.000Z'),
    user: { id: 'user-2', name: 'Bob' },
  }),
];

const createChannel = (
  overrides: {
    pinnedMessages?: Channel['state']['pinnedMessages'];
  } = {},
) =>
  fromPartial<Channel>({
    cid: 'messaging:test-channel',
    state: {
      pinnedMessages: overrides.pinnedMessages ?? pinnedMessages,
    },
  });

const renderWithChannel = (ui: React.ReactElement, channel: Channel = createChannel()) =>
  render(<ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>);

describe('PinnedMessagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.infiniteScrollPaginatorRenderCount = 0;
    mocks.searchSourceFilterBuilderOptions.length = 0;
    mocks.searchSourceInstances.length = 0;
    mocks.searchSourceOptions.length = 0;

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { timestamp?: Date }) => {
        if (key === 'timestamp/ChannelPreviewTimestamp') {
          return options?.timestamp?.toISOString() ?? key;
        }
        return key;
      },
      tDateTimeParser: (input?: string | Date) => new Date(input ?? Date.now()),
    } as ReturnType<typeof useTranslationContext>);

    vi.mocked(useChatContext).mockReturnValue({
      client: { userID: 'user-1' },
    } as ReturnType<typeof useChatContext>);

    vi.mocked(useModalContext).mockReturnValue({
      close: vi.fn(),
    } as ReturnType<typeof useModalContext>);

    vi.mocked(useChannelActionContext).mockReturnValue({
      jumpToMessage: vi.fn(),
    } as unknown as ReturnType<typeof useChannelActionContext>);

    vi.mocked(useStateStore).mockReturnValue({
      hasNextPage: false,
      isLoading: false,
      messages: undefined,
    });
  });

  it('renders pinned messages from channel state before a search is loaded', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(screen.getByRole('heading', { name: 'Pinned messages' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(
      screen.getByText('Release timeline: Code freeze March 18'),
    ).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Roadmap.pdf')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01T15:53:00.000Z')).toBeInTheDocument();
  });

  it('configures MessageSearchSource for pinned messages in the current channel', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(mocks.searchSourceOptions[0]).toMatchObject({
      debounceMs: 300,
      pageSize: 30,
      resetOnNewSearchQuery: false,
    });
    expect(mocks.searchSourceInstances[0]).toMatchObject({
      messageSearchChannelFilters: { cid: 'messaging:test-channel' },
      messageSearchFilters: { pinned: true },
    });
    expect(
      mocks.searchSourceFilterBuilderOptions[0].messageSearch?.initialFilterConfig?.text?.generate(
        { searchQuery: 'alice' },
      ),
    ).toEqual({
      text: { $autocomplete: 'alice' },
    });
  });

  it('searches pinned messages with the trimmed query', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: '  release  ' },
    });

    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('release');
  });

  it('resets to channel pinned messages without issuing an empty message search', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'release' },
    });
    mocks.searchSourceSearch.mockClear();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: '   ' },
    });

    expect(mocks.searchSourceCancelScheduledQuery).toHaveBeenCalled();
    expect(mocks.searchSourceResetState).toHaveBeenCalled();
    expect(mocks.searchSourceActivate).toHaveBeenCalled();
    expect(mocks.searchSourceSearch).not.toHaveBeenCalled();
  });

  it('does not re-render pinned message results while typing before source state changes', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    const renderCount = mocks.infiniteScrollPaginatorRenderCount;
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'release' },
    });

    expect(mocks.infiniteScrollPaginatorRenderCount).toBe(renderCount);
  });

  it('renders an empty state when there are no pinned messages', () => {
    renderWithChannel(
      <PinnedMessagesView layout='tabs' />,
      createChannel({ pinnedMessages: [] }),
    );

    expect(screen.getByText('No pinned messages')).toBeInTheDocument();
    expect(screen.getByText('Pin a message to see it here')).toBeInTheDocument();
  });
});
