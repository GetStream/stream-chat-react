import '@testing-library/jest-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';

import { ChatProvider, TranslationProvider } from '../../../context';
import { getTestClientWithUser } from '../../../mock-builders';
import { ChatView, useChatViewContext } from '../ChatView';

jest.mock('../../Threads', () => {
  const React = require('react');

  return {
    ThreadProvider: ({ children }) => <div data-testid='thread-provider'>{children}</div>,
  };
});

const ActivateThreadsView = () => {
  const { setActiveChatView } = useChatViewContext();

  useEffect(() => {
    setActiveChatView('threads');
  }, [setActiveChatView]);

  return null;
};

const renderComponent = async (threadManagerState) => {
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
        channelsQueryState: {},
        client,
        closeMobileNav: jest.fn(),
        getAppSettings: jest.fn(),
        latestMessageDatesByChannels: {},
        mutes: [],
        openMobileNav: jest.fn(),
        searchController: {},
        setActiveChannel: jest.fn(),
        theme: 'messaging light',
        useImageFlagEmojisOnWindows: false,
      }}
    >
      <TranslationProvider
        value={{
          t: (key) => key,
          tDateTimeParser: jest.fn(),
          userLanguage: 'en',
        }}
      >
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

describe('ChatView.ThreadAdapter', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the empty message state when no thread is selected after loading completes', async () => {
    await renderComponent({
      ready: true,
      threads: [{ id: 'thread-1' }],
      pagination: { isLoading: false },
    });

    expect(
      await screen.findByText('Send a message to start the conversation'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('thread-provider')).not.toBeInTheDocument();
  });

  it('renders the empty message state when the thread list is empty after loading completes', async () => {
    await renderComponent({
      ready: true,
      threads: [],
      pagination: { isLoading: false },
    });

    expect(
      await screen.findByText('Send a message to start the conversation'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('thread-provider')).not.toBeInTheDocument();
  });

  it('does not render the empty message state while threads are still loading', async () => {
    await renderComponent({
      ready: false,
      threads: [],
      pagination: { isLoading: true },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Send a message to start the conversation'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('thread-provider')).toBeInTheDocument();
  });
});
