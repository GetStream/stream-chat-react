import React from 'react';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Thread } from 'stream-chat';
import type { Channel, PaginatorState, StreamChat } from 'stream-chat';

import { ThreadList } from '../ThreadList';
import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import { mockT } from '../../../../mock-builders/translator';

const mockUseChatContext = vi.fn();
const mockUseComponentContext = vi.fn();
const mockUseTranslationContext = vi.fn();
const mockVirtuoso = vi.fn();
const mockScrollIntoView = vi.fn();
const mockUseAddNotificationOnError = vi.fn();

// Number of rows the mocked Virtuoso keeps in the DOM: a fixed window of the first N threads, so
// navigating past it takes the off-window scroll-into-view path as real virtualization does.
const MOCK_WINDOW_SIZE = 3;

// A Virtuoso stand-in with the props and handle ThreadList uses for keyboard navigation:
// `scrollerRef`, `onKeyDown` and a `ref` exposing `scrollIntoView`, which records the requested
// index. It renders only the first MOCK_WINDOW_SIZE threads, as `role="option"` buttons, so the
// rest are absent from the DOM. Like Virtuoso, it renders the `EmptyPlaceholder` slot while `data`
// is empty and the `Footer` slot always, both with the `context` prop.
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
    const data = props.data ?? [];
    const { EmptyPlaceholder, Footer } = props.components ?? {};
    return (
      <div
        aria-label={props['aria-label']}
        data-testid='virtuoso'
        onKeyDown={props.onKeyDown}
        ref={(el) => props.scrollerRef?.(el)}
        role={props.role}
      >
        {data.slice(0, MOCK_WINDOW_SIZE).map((thread: { id: string }) => (
          <button
            data-thread-id={thread.id}
            key={thread.id}
            role='option'
            type='button'
          />
        ))}
        {!data.length && EmptyPlaceholder && <EmptyPlaceholder context={props.context} />}
        {Footer && <Footer context={props.context} />}
      </div>
    );
  });
  Virtuoso.displayName = 'Virtuoso';
  return { Virtuoso };
});

vi.mock('../../../../context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../context')>()),
  useChatContext: () => mockUseChatContext(),
  useComponentContext: () => mockUseComponentContext(),
  useTranslationContext: () => mockUseTranslationContext(),
}));

vi.mock('../../../ListStates/ListLoadErrorUI', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../ListStates/ListLoadErrorUI')>()),
  ListLoadErrorUI: ({
    className,
    isRetrying,
    retry,
  }: {
    className?: string;
    isRetrying: boolean;
    retry: () => void;
  }) => (
    <button
      aria-busy={isRetrying}
      className={className}
      data-testid='list-load-error'
      onClick={retry}
      type='button'
    />
  ),
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
  // A real client, so `client.threads` and its paginator are genuine. The tests drive the list
  // through the paginator's state; `client.threads.reload` is stubbed to avoid a network call.
  let client: StreamChat;
  let channel: Channel;

  // Real threads: the thread manager reads them when the paginator's items change.
  const asThreads = (ids: string[]) =>
    ids.map(
      (id) => new Thread({ channel, client, parentMessage: generateMessage({ id }) }),
    );

  const setPaginatorState = (state: Partial<PaginatorState<Thread>>) =>
    act(() => {
      client.threads.paginator.state.partialNext(state);
    });

  beforeEach(async () => {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels());
    vi.spyOn(client.threads, 'reload').mockResolvedValue(undefined);
    mockUseChatContext.mockReturnValue({ client });
    mockUseComponentContext.mockReturnValue({});
    mockUseTranslationContext.mockReturnValue({ t: mockT });
    client.threads.paginator.state.partialNext({
      hasMoreTail: false,
      isLoading: false,
      items: [],
      lastQueryError: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the channel skeleton during the initial thread list load', () => {
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });

    const { container } = render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(
      container.querySelector(
        '.str-chat__thread-list--loading .str-chat__loading-channels',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list-unseen-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
  });

  it('renders the list with its empty placeholder before the first query starts', () => {
    client.threads.paginator.state.partialNext({ isLoading: false, items: undefined });

    const { container } = render(<ThreadList />);

    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__thread-list-empty-placeholder'),
    ).toBeInTheDocument();
  });

  it('renders the virtualized thread list once the initial load is complete', () => {
    client.threads.paginator.state.partialNext({ items: asThreads(['thread-1']) });

    const { container } = render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.getByTestId('thread-list-unseen-banner')).toBeInTheDocument();
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
    expect(mockVirtuoso).toHaveBeenCalledTimes(1);
    expect(mockVirtuoso.mock.calls[0][0]).toMatchObject({
      'aria-label': 'Thread list',
      data: [expect.objectContaining({ id: 'thread-1' })],
      role: 'listbox',
    });
  });

  it('follows the paginator state from the first load to the loaded threads', () => {
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });
    const { container } = render(<ThreadList />);
    expect(container.querySelector('.str-chat__loading-channels')).toBeInTheDocument();

    setPaginatorState({ isLoading: false, items: asThreads(['thread-1', 'thread-2']) });

    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('shows the skeleton, not the error, while a retry of the failed first load runs', () => {
    client.threads.paginator.state.partialNext({
      isLoading: true,
      items: undefined,
      lastQueryError: new Error('query failed'),
    });

    const { container } = render(<ThreadList />);

    expect(container.querySelector('.str-chat__loading-channels')).toBeInTheDocument();
    expect(screen.queryByTestId('list-load-error')).not.toBeInTheDocument();
  });

  it('keeps the loaded threads when a reload fails', () => {
    client.threads.paginator.state.partialNext({
      items: asThreads(['thread-1']),
      lastQueryError: new Error('query failed'),
    });

    render(<ThreadList />);

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.queryByTestId('list-load-error')).not.toBeInTheDocument();
  });

  it('shows the load error with a retry instead of the empty placeholder when the first load failed', () => {
    client.threads.paginator.state.partialNext({
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('query failed'),
    });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
    expect(client.threads.reload).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('list-load-error')).toHaveClass(
      'str-chat__thread-list-load-error',
    );
    fireEvent.click(screen.getByTestId('list-load-error'));

    expect(client.threads.reload).toHaveBeenCalledTimes(2);
    expect(client.threads.reload).toHaveBeenLastCalledWith({ force: true });
  });

  it('keeps the load error on screen instead of the skeleton while a retry loads', () => {
    client.threads.paginator.state.partialNext({
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('query failed'),
    });
    const { container } = render(<ThreadList />);
    vi.mocked(client.threads.reload).mockReturnValueOnce(new Promise(() => undefined));

    fireEvent.click(screen.getByTestId('list-load-error'));
    // The retry runs: the paginator is loading and reports no first-page error meanwhile.
    setPaginatorState({ isLoading: true });

    expect(screen.getByTestId('list-load-error')).toHaveAttribute('aria-busy', 'true');
    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
  });

  it('renders the ThreadListHeader override instead of the default header', () => {
    mockUseComponentContext.mockReturnValue({
      ThreadListHeader: () => <div data-testid='custom-thread-list-header' />,
    });

    render(<ThreadList />);

    expect(screen.getByTestId('custom-thread-list-header')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list-header')).not.toBeInTheDocument();
  });

  it('renders the overrides of the first-load skeleton and the load error', () => {
    const lastQueryError = new Error('query failed');
    const ListFirstPageLoadingUI = vi.fn(() => <div data-testid='custom-skeleton' />);
    const ListLoadErrorUI = vi.fn(() => <div data-testid='custom-load-error' />);
    mockUseComponentContext.mockReturnValue({
      ListFirstPageLoadingUI,
      ListLoadErrorUI,
    });
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });

    const { container } = render(<ThreadList />);
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
    expect(ListFirstPageLoadingUI.mock.lastCall?.[0]).toEqual({});
    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();

    setPaginatorState({ isLoading: false, lastQueryError });
    expect(screen.getByTestId('custom-load-error')).toBeInTheDocument();
    expect(ListLoadErrorUI.mock.lastCall?.[0]).toEqual({
      error: lastQueryError,
      isRetrying: false,
      retry: expect.any(Function),
    });
  });

  it('renders the deprecated ListLoadErrorIndicator over ListLoadErrorUI while set', () => {
    mockUseComponentContext.mockReturnValue({
      ListLoadErrorIndicator: () => <div data-testid='deprecated-load-error' />,
      ListLoadErrorUI: () => <div data-testid='custom-load-error' />,
    });
    client.threads.paginator.state.partialNext({
      isLoading: false,
      items: undefined,
      lastQueryError: new Error('query failed'),
    });

    render(<ThreadList />);

    expect(screen.getByTestId('deprecated-load-error')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-load-error')).not.toBeInTheDocument();
  });

  it('renders the deprecated FirstPageLoadingIndicator over ListFirstPageLoadingUI while set', () => {
    mockUseComponentContext.mockReturnValue({
      FirstPageLoadingIndicator: () => <div data-testid='deprecated-skeleton' />,
      ListFirstPageLoadingUI: () => <div data-testid='custom-skeleton' />,
    });
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });

    render(<ThreadList />);

    expect(screen.getByTestId('deprecated-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-skeleton')).not.toBeInTheDocument();
  });

  it('renders no first-page loading state when the deprecated FirstPageLoadingIndicator is null', () => {
    mockUseComponentContext.mockReturnValue({
      FirstPageLoadingIndicator: null,
      ListFirstPageLoadingUI: () => <div data-testid='custom-skeleton' />,
    });
    client.threads.paginator.state.partialNext({ isLoading: true, items: undefined });

    const { container } = render(<ThreadList />);

    expect(screen.queryByTestId('custom-skeleton')).not.toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
  });

  describe('empty state', () => {
    it('renders the default empty placeholder once a loaded page has no threads', () => {
      const { container } = render(<ThreadList />);

      expect(
        container.querySelector('.str-chat__thread-list-empty-placeholder'),
      ).toHaveTextContent('Reply to a message to start a thread');
    });

    it('renders the shared ListEmptyUI', () => {
      const ListEmptyUI = vi.fn(() => <div data-testid='custom-empty' />);
      mockUseComponentContext.mockReturnValue({ ListEmptyUI });

      render(<ThreadList />);

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(ListEmptyUI.mock.lastCall?.[0]).toEqual({});
    });

    it('renders the deprecated ThreadListEmptyPlaceholder instead of ListEmptyUI while set', () => {
      const ListEmptyUI = vi.fn(() => <div data-testid='custom-empty' />);
      mockUseComponentContext.mockReturnValue({
        ListEmptyUI,
        ThreadListEmptyPlaceholder: () => <div data-testid='deprecated-empty' />,
      });

      render(<ThreadList />);

      expect(screen.getByTestId('deprecated-empty')).toBeInTheDocument();
      expect(ListEmptyUI).not.toHaveBeenCalled();
    });

    it('renders no empty state while ThreadListEmptyPlaceholder is set to null', () => {
      const ListEmptyUI = vi.fn(() => <div data-testid='custom-empty' />);
      mockUseComponentContext.mockReturnValue({
        ListEmptyUI,
        ThreadListEmptyPlaceholder: null,
      });

      const { container } = render(<ThreadList />);

      expect(ListEmptyUI).not.toHaveBeenCalled();
      expect(
        container.querySelector('.str-chat__thread-list-empty-placeholder'),
      ).not.toBeInTheDocument();
    });

    it('renders the first-page state, not the empty state, while a load runs with no threads', () => {
      const ListEmptyUI = vi.fn(() => <div data-testid='custom-empty' />);
      const ListFirstPageLoadingUI = vi.fn(() => <div data-testid='custom-skeleton' />);
      mockUseComponentContext.mockReturnValue({
        ListEmptyUI,
        ListFirstPageLoadingUI,
      });
      // A reload of a list that loaded no threads.
      client.threads.paginator.state.partialNext({ isLoading: true, items: [] });

      render(<ThreadList />);

      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-empty')).not.toBeInTheDocument();

      setPaginatorState({ isLoading: false });
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  it('keeps its own slots working when virtuosoProps sets a Virtuoso context', () => {
    const ListEmptyUI = vi.fn(() => <div data-testid='custom-empty' />);
    mockUseComponentContext.mockReturnValue({ ListEmptyUI });

    render(<ThreadList virtuosoProps={{ context: { app: 'value' } }} />);

    expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
  });

  it("passes Virtuoso's context to the deprecated empty and footer slots", () => {
    const ThreadListEmptyPlaceholder = vi.fn(() => null);
    const ThreadListLoadingIndicator = vi.fn(() => null);
    mockUseComponentContext.mockReturnValue({
      ThreadListEmptyPlaceholder,
      ThreadListLoadingIndicator,
    });

    render(<ThreadList virtuosoProps={{ context: { app: 'value' } }} />);

    expect(ThreadListEmptyPlaceholder.mock.lastCall?.[0]).toEqual({
      context: { app: 'value' },
    });
    expect(ThreadListLoadingIndicator.mock.lastCall?.[0]).toEqual({
      context: { app: 'value' },
    });
  });

  describe('footer', () => {
    it('renders the shared ListLoadingNextPageUI and no ListEndReachedUI', () => {
      const ListEndReachedUI = vi.fn(() => null);
      const ListLoadingNextPageUI = vi.fn(() => null);
      mockUseComponentContext.mockReturnValue({
        ListEndReachedUI,
        ListLoadingNextPageUI,
      });
      client.threads.paginator.state.partialNext({
        hasMoreTail: true,
        items: asThreads(['thread-1']),
      });

      render(<ThreadList />);

      expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
        isLoading: false,
        position: 'bottom',
      });
      setPaginatorState({ hasMoreTail: false, isLoading: true });

      expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
        isLoading: true,
        position: 'bottom',
      });
      expect(ListEndReachedUI).not.toHaveBeenCalled();
    });

    it('renders the default spinner at the bottom while the next page loads', () => {
      client.threads.paginator.state.partialNext({ items: asThreads(['thread-1']) });
      const { container } = render(<ThreadList />);
      expect(
        container.querySelector('.str-chat__thread-list-loading-indicator'),
      ).not.toBeInTheDocument();

      setPaginatorState({ isLoading: true });

      expect(
        container.querySelector('.str-chat__thread-list-loading-indicator'),
      ).toBeInTheDocument();
    });

    it('renders no next-page indicator while ThreadListLoadingIndicator is set to null', () => {
      const ListLoadingNextPageUI = vi.fn(() => null);
      mockUseComponentContext.mockReturnValue({
        ListLoadingNextPageUI,
        ThreadListLoadingIndicator: null,
      });
      client.threads.paginator.state.partialNext({
        isLoading: true,
        items: asThreads(['thread-1']),
      });

      const { container } = render(<ThreadList />);

      expect(ListLoadingNextPageUI).not.toHaveBeenCalled();
      expect(
        container.querySelector('.str-chat__thread-list-loading-indicator'),
      ).not.toBeInTheDocument();
    });

    it('renders the deprecated ThreadListLoadingIndicator instead of ListLoadingNextPageUI while set', () => {
      const ListLoadingNextPageUI = vi.fn(() => null);
      mockUseComponentContext.mockReturnValue({
        ListLoadingNextPageUI,
        ThreadListLoadingIndicator: () => <div data-testid='deprecated-loading' />,
      });
      client.threads.paginator.state.partialNext({
        isLoading: true,
        items: asThreads(['thread-1']),
      });

      render(<ThreadList />);

      expect(screen.getByTestId('deprecated-loading')).toBeInTheDocument();
      expect(ListLoadingNextPageUI).not.toHaveBeenCalled();
    });
  });

  it('publishes query errors as notifications for the thread list panel', () => {
    const lastQueryError = new Error('query failed');
    client.threads.paginator.state.partialNext({
      items: asThreads(['thread-1']),
      lastQueryError,
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
    client.threads.paginator.state.partialNext({
      isLoading: true,
      items: asThreads(['thread-1']),
    });

    const { container } = render(<ThreadList />);

    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(
      container.querySelector('.str-chat__loading-channels'),
    ).not.toBeInTheDocument();
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
    client.threads.paginator.state.partialNext({ items: asThreads(['thread-1']) });

    render(<ThreadList />);
    const { atBottomStateChange } = mockVirtuoso.mock.calls[0][0];

    atBottomStateChange(false);
    expect(toTail).not.toHaveBeenCalled();

    atBottomStateChange(true);
    expect(toTail).toHaveBeenCalledTimes(1);
  });

  // 5 threads, but the mocked Virtuoso renders only the first MOCK_WINDOW_SIZE (3).
  const FIVE_THREAD_IDS = ['thread-1', 'thread-2', 'thread-3', 'thread-4', 'thread-5'];
  const optionFor = (id: string) =>
    document.querySelector<HTMLElement>(`[role="option"][data-thread-id="${id}"]`);

  it('roves within the rendered window with the vertical arrow keys', () => {
    client.threads.paginator.state.partialNext({ items: asThreads(FIVE_THREAD_IDS) });

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
    client.threads.paginator.state.partialNext({ items: asThreads(FIVE_THREAD_IDS) });

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
