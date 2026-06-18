import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, LocalMessage, MessageSearchSource } from 'stream-chat';
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

vi.mock(
  '../../../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator',
  () => ({
    InfiniteScrollPaginator: ({ children }: { children: React.ReactNode }) => {
      mocks.infiniteScrollPaginatorRenderCount += 1;
      return <div data-testid='infinite-scroll-paginator'>{children}</div>;
    },
  }),
);

vi.mock('../../../../../components/Dialog', () => ({
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

type ChannelEventHandler = (event?: unknown) => void;

const channelEventHandlers = new WeakMap<
  Channel,
  Record<string, ChannelEventHandler[]>
>();

const emitChannelEvent = (channel: Channel, event: string) =>
  act(() => {
    channelEventHandlers.get(channel)?.[event]?.forEach((handler) => handler());
  });

const createChannel = (
  overrides: {
    pinnedMessages?: Channel['state']['pinnedMessages'];
  } = {},
) => {
  const handlers: Record<string, ChannelEventHandler[]> = {};

  const channel = fromPartial<Channel>({
    cid: 'messaging:test-channel',
    on: vi.fn((event: string, handler: ChannelEventHandler) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
      return { unsubscribe: vi.fn() };
    }),
    state: {
      pinnedMessages: overrides.pinnedMessages ?? pinnedMessages,
    },
  });

  channelEventHandlers.set(channel, handlers);

  return channel;
};

const renderWithChannel = (ui: React.ReactElement, channel: Channel = createChannel()) =>
  render(<ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>);

// Sets the search source's reactive state, consumed by the hook (messages) and
// the loading indicator (hasNextPage/isLoading). `messages: undefined` models
// "first page not loaded yet".
const mockSearchSourceState = (
  state: { hasNextPage?: boolean; isLoading?: boolean; messages?: unknown } = {},
) =>
  vi.mocked(useStateStore).mockReturnValue({
    hasNextPage: false,
    isLoading: false,
    messages: undefined,
    ...state,
  });

describe('PinnedMessagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.infiniteScrollPaginatorRenderCount = 0;
    mocks.searchSourceFilterBuilderOptions.length = 0;
    mocks.searchSourceInstances.length = 0;
    mocks.searchSourceOptions.length = 0;

    vi.mocked(useTranslationContext).mockReturnValue({
      t: (key: string, options?: { timestamp?: Date }) => {
        if (key === 'timestamp/ChannelDetailPinnedMessageTimestamp') {
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

    mockSearchSourceState();
  });

  it('configures MessageSearchSource for pinned messages in the current channel', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(screen.getByRole('heading', { name: 'Pinned messages' })).toBeInTheDocument();
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

  it('loads the first page on mount when the channel has pinned messages', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
  });

  it('renders the messages provided by the search source', () => {
    mockSearchSourceState({ messages: pinnedMessages });

    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(
      screen.getByText('Release timeline: Code freeze March 18'),
    ).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Roadmap.pdf')).toBeInTheDocument();
  });

  it('searches pinned messages with the trimmed query', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: '  release  ' },
    });

    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('release');
  });

  it('reloads the full pinned list when the query is cleared', () => {
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
    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
  });

  it('does not re-render results while typing before source state changes', () => {
    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    const renderCount = mocks.infiniteScrollPaginatorRenderCount;
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'release' },
    });

    expect(mocks.infiniteScrollPaginatorRenderCount).toBe(renderCount);
  });

  it('renders the empty state when there are no pinned messages', () => {
    renderWithChannel(
      <PinnedMessagesView layout='tabs' />,
      createChannel({ pinnedMessages: [] }),
    );

    expect(screen.getByText('No pinned messages')).toBeInTheDocument();
    expect(screen.getByText('Pin a message to see it here')).toBeInTheDocument();
  });

  it('does not render the search input or issue a query when there are no pinned messages', () => {
    renderWithChannel(
      <PinnedMessagesView layout='tabs' />,
      createChannel({ pinnedMessages: [] }),
    );

    expect(screen.queryByRole('searchbox', { name: 'Search' })).not.toBeInTheDocument();
    expect(mocks.searchSourceSearch).not.toHaveBeenCalled();
  });

  it('shows "No messages found" when a search returns no results', () => {
    mockSearchSourceState({ messages: [] });

    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(screen.getByText('No messages found')).toBeInTheDocument();
    expect(screen.queryByText('No pinned messages')).not.toBeInTheDocument();
  });

  it('does not show the no-pins empty state while the first page is loading', () => {
    // Channel has pins, but the search source has not resolved a page yet.
    mockSearchSourceState({ messages: undefined });

    renderWithChannel(<PinnedMessagesView layout='tabs' />);

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.queryByText('No pinned messages')).not.toBeInTheDocument();
    expect(screen.queryByText('No messages found')).not.toBeInTheDocument();
  });

  it('shows the search input and loads once a message is pinned during the session', () => {
    const channel = createChannel({ pinnedMessages: [] });

    renderWithChannel(<PinnedMessagesView layout='tabs' />, channel);

    // No pinned messages yet: the search input is suppressed and nothing loads.
    expect(screen.queryByRole('searchbox', { name: 'Search' })).not.toBeInTheDocument();
    expect(mocks.searchSourceSearch).not.toHaveBeenCalled();

    // A message is pinned; the view reacts without a remount.
    channel.state.pinnedMessages = pinnedMessages;
    emitChannelEvent(channel, 'message.updated');

    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(mocks.searchSourceSearch).toHaveBeenCalledWith('');
  });

  it('uses a provided custom search source instead of creating one', () => {
    const customSearchSource = fromPartial<MessageSearchSource>({
      activate: vi.fn(),
      cancelScheduledQuery: vi.fn(),
      search: vi.fn(),
      state: {},
    });

    renderWithChannel(
      <PinnedMessagesView layout='tabs' searchSource={customSearchSource} />,
    );

    // No own source is constructed, and the provided one drives the first load.
    expect(mocks.searchSourceInstances).toHaveLength(0);
    expect(customSearchSource.search).toHaveBeenCalledWith('');
  });
});
