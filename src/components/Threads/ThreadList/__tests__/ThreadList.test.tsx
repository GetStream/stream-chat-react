import React from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PaginatorState, StreamChat, Thread } from 'stream-chat';

import { ThreadList } from '../ThreadList';
import { initClientWithChannels } from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';

const mockUseChatContext = vi.fn();
const mockUseComponentContext = vi.fn();
const mockUseTranslationContext = vi.fn();
const mockUseStateStore = vi.fn();
const mockVirtuoso = vi.fn();
const mockScrollIntoView = vi.fn();
const mockUseAddNotificationOnError = vi.fn();

// Number of rows the mocked Virtuoso keeps in the DOM: a fixed window of the first N threads, so
// navigating past it takes the off-window scroll-into-view path as real virtualization does.
const MOCK_WINDOW_SIZE = 3;

// A Virtuoso stand-in with the props and handle ThreadList uses for keyboard navigation:
// `scrollerRef`, `onKeyDown` and a `ref` exposing `scrollIntoView`, which records the requested
// index. It renders only the first MOCK_WINDOW_SIZE threads, as `role="option"` buttons, so the
// rest are absent from the DOM.
vi.mock('react-virtuoso', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const Virtuoso = React.forwardRef((props: Record<string, any>, ref) => {
    mockVirtuoso(props);
    React.useImperativeHandle(ref, () => ({
      scrollIntoView: ({ index }: { done?: () => void; index: number }) => {
        mockScrollIntoView(index);
      },
      scrollToIndex: () => {},
    }));
    return (
      <div
        aria-label={props['aria-label']}
        data-testid='virtuoso'
        onKeyDown={props.onKeyDown}
        ref={(el) => props.scrollerRef?.(el)}
        role={props.role}
      >
        {(props.data ?? []).slice(0, MOCK_WINDOW_SIZE).map((thread: { id: string }) => (
          <button
            data-thread-id={thread.id}
            key={thread.id}
            role='option'
            type='button'
          />
        ))}
      </div>
    );
  });
  Virtuoso.displayName = 'Virtuoso';
  return { Virtuoso };
});

vi.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useComponentContext: () => mockUseComponentContext(),
  useTranslationContext: () => mockUseTranslationContext(),
}));

vi.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
}));

vi.mock('../../../Loading', () => ({
  ListLoadErrorIndicator: ({
    isRetrying,
    listType,
    retry,
  }: {
    isRetrying: boolean;
    listType: string;
    retry: () => void;
  }) => (
    <button
      aria-busy={isRetrying}
      data-testid={`${listType}-load-error`}
      onClick={retry}
      type='button'
    />
  ),
  LoadingChannels: () => <div data-testid='loading-channels' />,
}));

vi.mock('../../../Notifications/hooks/useAddNotificationOnError', () => ({
  useAddNotificationOnError: (...args) => mockUseAddNotificationOnError(...args),
}));

vi.mock('../ThreadListHeader', () => ({
  ThreadListHeader: () => <div data-testid='thread-list-header' />,
}));

vi.mock('../ThreadListUnseenThreadsBanner', () => ({
  ThreadListUnseenThreadsBanner: () => <div data-testid='thread-list-unseen-banner' />,
}));

vi.mock('../../../Notifications', () => ({
  NotificationList: () => null,
}));

describe('ThreadList', () => {
  // A real client, so `client.threads` and its paginator are genuine. `useStateStore` is mocked to
  // drive isLoading/threads, and `client.threads.reload` is stubbed to avoid a network call.
  let client: StreamChat;

  beforeEach(async () => {
    ({ client } = await initClientWithChannels());
    vi.spyOn(client.threads, 'reload').mockResolvedValue(undefined);
    mockUseChatContext.mockReturnValue({ client });
    mockUseComponentContext.mockReturnValue({});
    mockUseTranslationContext.mockReturnValue({ t: mockT });
    mockUseStateStore.mockReturnValue({ isLoading: false, threads: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders channel-list skeletons during the initial thread list load', () => {
    mockUseStateStore.mockReturnValue({ isLoading: true, threads: [] });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.getByTestId('loading-channels')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list-unseen-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
  });

  it('renders the virtualized thread list once the initial load is complete', () => {
    mockUseStateStore.mockReturnValue({
      isLoading: false,
      threads: [{ id: 'thread-1' }],
    });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.getByTestId('thread-list-unseen-banner')).toBeInTheDocument();
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-channels')).not.toBeInTheDocument();
    expect(mockVirtuoso).toHaveBeenCalledTimes(1);
    expect(mockVirtuoso.mock.calls[0][0]).toMatchObject({
      'aria-label': 'Thread list',
      role: 'listbox',
    });
  });

  it('reads the threads and the loading state from the thread paginator', () => {
    render(<ThreadList />);

    const [store, selector] = mockUseStateStore.mock.calls[0];
    expect(store).toBe(client.threads.paginator.state);
    expect(
      selector({ isLoading: true, items: undefined } as PaginatorState<Thread>),
    ).toEqual({
      firstPageLoadError: undefined,
      isLoading: true,
      lastQueryError: undefined,
      threads: [],
    });
    const threads = [{ id: 'thread-1' }] as Thread[];
    expect(
      selector({ isLoading: false, items: threads } as PaginatorState<Thread>),
    ).toEqual({
      firstPageLoadError: undefined,
      isLoading: false,
      lastQueryError: undefined,
      threads,
    });
    const lastQueryError = new Error('query failed');
    expect(
      selector({
        isLoading: false,
        items: undefined,
        lastQueryError,
      } as PaginatorState<Thread>),
    ).toEqual({
      firstPageLoadError: lastQueryError,
      isLoading: false,
      lastQueryError,
      threads: [],
    });
    // A retry of the failed first load shows the skeleton, not the error.
    expect(
      selector({
        isLoading: true,
        items: undefined,
        lastQueryError,
      } as PaginatorState<Thread>),
    ).toEqual({
      firstPageLoadError: undefined,
      isLoading: true,
      lastQueryError,
      threads: [],
    });
    // A failed reload keeps the loaded threads.
    expect(
      selector({
        isLoading: false,
        items: threads,
        lastQueryError,
      } as PaginatorState<Thread>),
    ).toEqual({
      firstPageLoadError: undefined,
      isLoading: false,
      lastQueryError,
      threads,
    });
  });

  it('shows the load error with a retry instead of the empty placeholder when the first load failed', () => {
    mockUseStateStore.mockReturnValue({
      firstPageLoadError: new Error('query failed'),
      isLoading: false,
      threads: [],
    });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
    expect(client.threads.reload).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('thread-load-error'));

    expect(client.threads.reload).toHaveBeenCalledTimes(2);
    expect(client.threads.reload).toHaveBeenLastCalledWith({ force: true });
  });

  it('keeps the load error on screen instead of the skeleton while a retry loads', () => {
    mockUseStateStore.mockReturnValue({
      firstPageLoadError: new Error('query failed'),
      isLoading: false,
      threads: [],
    });
    const { rerender } = render(<ThreadList />);
    vi.mocked(client.threads.reload).mockReturnValueOnce(new Promise(() => undefined));

    fireEvent.click(screen.getByTestId('thread-load-error'));
    // The retry runs: the paginator is loading and reports no first-page error meanwhile.
    mockUseStateStore.mockReturnValue({ isLoading: true, threads: [] });
    rerender(<ThreadList />);

    expect(screen.getByTestId('thread-load-error')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('loading-channels')).not.toBeInTheDocument();
  });

  it('renders the overrides of the first-load skeleton and the load error', () => {
    const lastQueryError = new Error('query failed');
    const ListLoadErrorIndicator = vi.fn(() => <div data-testid='custom-load-error' />);
    mockUseComponentContext.mockReturnValue({
      FirstPageLoadingIndicator: () => <div data-testid='custom-skeleton' />,
      ListLoadErrorIndicator,
    });
    mockUseStateStore.mockReturnValue({ isLoading: true, threads: [] });

    const { rerender } = render(<ThreadList />);
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-channels')).not.toBeInTheDocument();

    mockUseStateStore.mockReturnValue({
      firstPageLoadError: lastQueryError,
      isLoading: false,
      lastQueryError,
      threads: [],
    });
    rerender(<ThreadList />);
    expect(screen.getByTestId('custom-load-error')).toBeInTheDocument();
    expect(ListLoadErrorIndicator.mock.lastCall?.[0]).toEqual({
      error: lastQueryError,
      isRetrying: false,
      retry: expect.any(Function),
    });
  });

  it('publishes query errors as notifications for the thread list panel', () => {
    const lastQueryError = new Error('query failed');
    mockUseStateStore.mockReturnValue({
      isLoading: false,
      lastQueryError,
      threads: [{ id: 'thread-1' }],
    });

    render(<ThreadList />);

    expect(mockUseAddNotificationOnError).toHaveBeenLastCalledWith(lastQueryError, {
      emitter: 'ThreadList',
      message: "Couldn't load threads",
      targetPanels: ['thread-list'],
      type: 'api:thread:query:failed',
    });
  });

  it('keeps the loaded threads on screen while the paginator is loading', () => {
    // `isLoading` with threads loaded is the next page, not the first load.
    mockUseStateStore.mockReturnValue({ isLoading: true, threads: [{ id: 'thread-1' }] });

    render(<ThreadList />);

    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-channels')).not.toBeInTheDocument();
  });

  it('reloads the list on mount without resetting the manager state', () => {
    client.threads.state.partialNext({ unseenThreadIds: ['unseen-thread'] });

    render(<ThreadList />);

    expect(client.threads.reload).toHaveBeenCalledWith({ force: true });
    expect(client.threads.state.getLatestValue().unseenThreadIds).toEqual([
      'unseen-thread',
    ]);
  });

  it('loads the next page through the paginator when scrolled to the bottom', () => {
    const toTail = vi
      .spyOn(client.threads.paginator, 'toTail')
      .mockResolvedValue(undefined);
    mockUseStateStore.mockReturnValue({
      isLoading: false,
      threads: [{ id: 'thread-1' }],
    });

    render(<ThreadList />);
    const { atBottomStateChange } = mockVirtuoso.mock.calls[0][0];

    atBottomStateChange(false);
    expect(toTail).not.toHaveBeenCalled();

    atBottomStateChange(true);
    expect(toTail).toHaveBeenCalledTimes(1);
  });

  // 5 threads, but the mocked Virtuoso renders only the first MOCK_WINDOW_SIZE (3).
  const FIVE_THREADS = [
    { id: 'thread-1' },
    { id: 'thread-2' },
    { id: 'thread-3' },
    { id: 'thread-4' },
    { id: 'thread-5' },
  ];
  const optionFor = (id: string) =>
    document.querySelector<HTMLElement>(`[role="option"][data-thread-id="${id}"]`);

  it('roves within the rendered window with the vertical arrow keys', () => {
    mockUseStateStore.mockReturnValue({ isLoading: false, threads: FIVE_THREADS });

    render(<ThreadList />);
    const listbox = screen.getByTestId('virtuoso');
    optionFor('thread-1')!.focus();

    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(optionFor('thread-2'));

    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(optionFor('thread-3'));

    // Every target was already in the DOM, so no scroll is requested.
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls an off-window index into view instead of cycling within the rendered window', () => {
    mockUseStateStore.mockReturnValue({ isLoading: false, threads: FIVE_THREADS });

    render(<ThreadList />);
    const listbox = screen.getByTestId('virtuoso');
    // Focus the last rendered row (index 2); the next row (index 3) is not in the DOM.
    optionFor('thread-3')!.focus();

    // Regression guard: a DOM-only roving approach wraps to the first rendered option and never
    // calls scrollIntoView.
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(mockScrollIntoView).toHaveBeenLastCalledWith(3);
    // Focus does not wrap back into the window.
    expect(document.activeElement).not.toBe(optionFor('thread-1'));

    // End scrolls to the last thread (index 4).
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(mockScrollIntoView).toHaveBeenLastCalledWith(4);
  });
});
