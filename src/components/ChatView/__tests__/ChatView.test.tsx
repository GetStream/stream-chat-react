import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { useEffect } from 'react';

import { fromPartial } from '@total-typescript/shoehorn';
import { ChatProvider, TranslationProvider } from '../../../context';
import {
  getTestClientWithUser,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { ChatView, useChatViewContext } from '../ChatView';

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

const renderComponent = async (threadManagerState: any) => {
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

const renderSelector = async (selectorProps?: any) => {
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

    expect(screen.getByRole('tab', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Threads' })).toBeInTheDocument();
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
});
