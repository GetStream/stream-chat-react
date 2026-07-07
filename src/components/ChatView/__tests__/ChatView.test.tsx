import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { useEffect } from 'react';

import { fromPartial } from '@total-typescript/shoehorn';
import { axe } from '../../../../axe-helper';
import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView, type ChatViewSelectorProps, useChatViewContext } from '../ChatView';

import type { TranslationContextValue } from '../../../context';
import type { ThreadManagerState } from 'stream-chat';

vi.mock('../../Threads', async () => {
  const React = await import('react');

  return {
    ThreadProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid='thread-provider'>{children}</div>
    ),
  };
});

const ActivateThreadsView = () => {
  const { setActiveChatView } = useChatViewContext();

  useEffect(() => {
    setActiveChatView('threads');
  }, [setActiveChatView]);

  return null;
};

type ThreadManagerStatePatch = Partial<Omit<ThreadManagerState, 'pagination'>> & {
  pagination?: Partial<ThreadManagerState['pagination']>;
};

const renderComponent = async (threadManagerState: ThreadManagerStatePatch) => {
  const client = await getTestClientWithUser();
  const currentThreadManagerState = client.threads.state.getLatestValue();

  client.threads.state.next({
    ...currentThreadManagerState,
    ...threadManagerState,
    pagination: {
      ...currentThreadManagerState.pagination,
      ...threadManagerState.pagination,
    },
  });

  return render(
    <ChatProvider
      value={{
        channelsQueryState: fromPartial({}),
        client,
        getAppSettings: vi.fn(),
        latestMessageDatesByChannels: {},
        mutes: [],
        searchController: fromPartial({}),
        setActiveChannel: vi.fn(),
        theme: 'messaging light',
        useImageFlagEmojisOnWindows: false,
      }}
    >
      <TranslationProvider value={mockTranslationContextValue()}>
        <ChatView>
          <ActivateThreadsView />
          <ChatView.Threads>
            <div data-testid='thread-list' />
            <ChatView.ThreadAdapter>
              <div data-testid='thread-content' />
            </ChatView.ThreadAdapter>
          </ChatView.Threads>
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );
};

const renderSelector = async (selectorProps?: ChatViewSelectorProps) => {
  const client = await getTestClientWithUser();

  return render(
    <ChatProvider
      value={{
        channelsQueryState: fromPartial({}),
        client,
        getAppSettings: vi.fn(),
        latestMessageDatesByChannels: {},
        mutes: [],
        searchController: fromPartial({}),
        setActiveChannel: vi.fn(),
        theme: 'messaging light',
        useImageFlagEmojisOnWindows: false,
      }}
    >
      <TranslationProvider value={mockTranslationContextValue()}>
        <ChatView>
          <ChatView.Selector {...selectorProps} />
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );
};

const renderSelectorWithPanels = async ({
  selectorProps,
  threadManagerState = {},
  translationContextValue = mockTranslationContextValue(),
}: {
  selectorProps?: ChatViewSelectorProps;
  threadManagerState?: ThreadManagerStatePatch;
  translationContextValue?: TranslationContextValue;
} = {}) => {
  const client = await getTestClientWithUser();
  const currentThreadManagerState = client.threads.state.getLatestValue();

  client.threads.state.next({
    ...currentThreadManagerState,
    ...threadManagerState,
    pagination: {
      ...currentThreadManagerState.pagination,
      ...threadManagerState.pagination,
    },
  });

  return render(
    <ChatProvider
      value={{
        channelsQueryState: fromPartial({}),
        client,
        getAppSettings: vi.fn(),
        latestMessageDatesByChannels: {},
        mutes: [],
        searchController: fromPartial({}),
        setActiveChannel: vi.fn(),
        theme: 'messaging light',
        useImageFlagEmojisOnWindows: false,
      }}
    >
      <TranslationProvider value={translationContextValue}>
        <ChatView>
          <ChatView.Selector {...selectorProps} />
          <ChatView.Channels>
            <div data-testid='channels-panel-content' />
          </ChatView.Channels>
          <ChatView.Threads>
            <div data-testid='threads-panel-content' />
          </ChatView.Threads>
        </ChatView>
      </TranslationProvider>
    </ChatProvider>,
  );
};

describe('ChatView.ThreadAdapter', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the empty message state when no thread is selected after loading completes', async () => {
    await renderComponent({
      pagination: { isLoading: false },
      ready: true,
      threads: [{ id: 'thread-1' }],
    });

    expect(
      await screen.findByText('Select a thread to continue the conversation'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('thread-provider')).not.toBeInTheDocument();
  });

  it('renders the empty message state when the thread list is empty after loading completes', async () => {
    await renderComponent({
      pagination: { isLoading: false },
      ready: true,
      threads: [],
    });

    expect(
      await screen.findByText('Select a thread to continue the conversation'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('thread-provider')).not.toBeInTheDocument();
  });

  it('does not render the empty message state while threads are still loading', async () => {
    await renderComponent({
      pagination: { isLoading: true },
      ready: false,
      threads: [],
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Select a thread to continue the conversation'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('thread-provider')).toBeInTheDocument();
  });
});

describe('ChatView.Selector', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders tooltips instead of inline labels by default', async () => {
    const { container } = await renderSelector();

    expect(
      screen.getByRole('button', { name: 'Open channels view' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open threads view' })).toBeInTheDocument();
    expect(
      container.querySelectorAll('.str-chat__chat-view__selector-button-text'),
    ).toHaveLength(0);

    const tooltips = Array.from(
      container.querySelectorAll('.str-chat__chat-view__selector-button-tooltip'),
    );

    expect(tooltips).toHaveLength(2);
    expect(tooltips.map((element) => element.textContent)).toEqual([
      'Channels',
      'Threads',
    ]);
  });

  it('renders labels inline when iconOnly is disabled', async () => {
    const { container } = await renderSelector({ iconOnly: false });

    expect(
      container.querySelectorAll('.str-chat__chat-view__selector-button-tooltip'),
    ).toHaveLength(0);
    expect(
      Array.from(
        container.querySelectorAll('.str-chat__chat-view__selector-button-text'),
      ).map((element) => element.textContent),
    ).toEqual(['Channels', 'Threads']);
  });

  it('exposes the selector as a navigation landmark whose current item is aria-current, and only renders the active view container (no tab/tabpanel roles)', async () => {
    await renderSelectorWithPanels();

    const nav = screen.getByRole('navigation', { name: 'Chat view controls' });
    const channelsButton = screen.getByRole('button', { name: 'Open channels view' });
    const threadsButton = screen.getByRole('button', { name: 'Open threads view' });

    expect(nav).toContainElement(channelsButton);
    expect(nav).toContainElement(threadsButton);

    // The current view's button is marked aria-current="true" (generic "current item" — not "page",
    // since the SDK may be embedded in a larger host UI), not aria-pressed.
    expect(channelsButton).toHaveAttribute('aria-current', 'true');
    expect(threadsButton).not.toHaveAttribute('aria-current');
    expect(channelsButton).not.toHaveAttribute('aria-pressed');

    // No WAI-ARIA Tabs semantics anywhere (the finding's "announced as tab" is gone).
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();

    // Active view container is a plain div with a stable id and no landmark role.
    const channelsPanel = screen.getByTestId('channels-panel-content').parentElement;
    expect(channelsPanel).not.toHaveAttribute('role');
    expect(channelsPanel).not.toHaveAttribute('aria-labelledby');
    expect(channelsPanel?.id).toMatch(/str-chat__chat-view-.*-panel-channels$/);

    // Inactive view is not rendered.
    expect(screen.queryByTestId('threads-panel-content')).toBeNull();
  });

  it('hides only the numeric unread badge from AT, not the wrapper', async () => {
    // The threads button wraps its icon in UnreadCountBadge. Only the numeric count is aria-hidden
    // (it rides in the button's aria-label already, so it must not be announced twice); the wrapper
    // stays in the a11y tree so it does not swallow arbitrary children. The plain wrapper div
    // exposes no role, so no stray "group" is announced inside the button.
    await renderSelectorWithPanels({ threadManagerState: { unreadThreadCount: 3 } });

    const threadsButton = screen.getByRole('button', { name: /Open threads view/ });
    const wrapper = threadsButton.querySelector(
      '.str-chat__unread-count-badge-container',
    );
    expect(wrapper).not.toHaveAttribute('aria-hidden');
    expect(threadsButton.querySelector('.str-chat__unread-count-badge')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    // No group is exposed within the selector's buttons.
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('moves aria-current when the active view changes', async () => {
    await renderSelectorWithPanels();

    const channelsButton = screen.getByRole('button', { name: 'Open channels view' });
    const threadsButton = screen.getByRole('button', { name: 'Open threads view' });

    expect(channelsButton).toHaveAttribute('aria-current', 'true');
    expect(threadsButton).not.toHaveAttribute('aria-current');

    fireEvent.click(threadsButton);

    await waitFor(() => {
      expect(threadsButton).toHaveAttribute('aria-current', 'true');
      expect(channelsButton).not.toHaveAttribute('aria-current');
      expect(screen.getByTestId('threads-panel-content')).toBeInTheDocument();
      expect(screen.queryByTestId('channels-panel-content')).toBeNull();
    });
  });

  it('includes unread thread count in the threads button accessible name', async () => {
    await renderSelectorWithPanels({
      threadManagerState: { unreadThreadCount: 3 },
      translationContextValue: mockTranslationContextValue({
        t: ((key: string, options?: { count?: number }) => {
          if (key === 'aria/Open threads view with unread threads') {
            return `Open threads view, ${options?.count ?? 0} unread threads`;
          }

          return key.split('/').pop();
        }) as TranslationContextValue['t'],
      }),
    });

    expect(
      screen.getByRole('button', {
        name: 'Open threads view, 3 unread threads',
      }),
    ).toBeInTheDocument();
  });

  it('has no axe violations for nav landmark + view markup', async () => {
    const { container } = await renderSelectorWithPanels();

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
