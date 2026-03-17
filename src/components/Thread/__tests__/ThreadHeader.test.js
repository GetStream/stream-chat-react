import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { ThreadHeader } from '../ThreadHeader';

jest.mock('../../ChannelPreview/hooks/useChannelPreviewInfo', () => ({
  useChannelPreviewInfo: jest.fn(() => ({ displayTitle: undefined })),
}));

jest.mock('../../../store', () => ({
  useStateStore: jest.fn(() => undefined),
}));

jest.mock('../../../context/TypingContext', () => ({
  useTypingContext: jest.fn(() => ({ typing: {} })),
}));

jest.mock('../../TypingIndicator/TypingIndicatorHeader', () => ({
  TypingIndicatorHeader: () => <div>Typing...</div>,
}));

jest.mock('../../Button/ToggleSidebarButton', () => ({
  ToggleSidebarButton: ({ children }) => (
    <div data-testid='toggle-sidebar-button'>{children}</div>
  ),
}));

jest.mock('../../Threads', () => ({
  useThreadContext: jest.fn(() => undefined),
}));

jest.mock('../../ChatView', () => ({
  useChatViewContext: jest.fn(() => ({ activeChatView: 'channels' })),
}));

const {
  useChannelPreviewInfo,
} = require('../../ChannelPreview/hooks/useChannelPreviewInfo');
const { useChatViewContext } = require('../../ChatView');
const { useThreadContext } = require('../../Threads');

const alice = { id: 'alice', name: 'Alice' };
const bob = { id: 'bob', name: 'Bob' };

const createThread = (user) => ({
  id: `${user?.id ?? 'thread'}-message`,
  reply_count: 2,
  user,
});

const createChannel = (overrides = {}) => ({
  data: undefined,
  getClient: () => ({ userID: alice.id }),
  state: {
    members: {
      [alice.id]: { user: alice },
      [bob.id]: { user: bob },
    },
  },
  ...overrides,
});

const renderComponent = ({
  activeChatView = 'channels',
  channelOverrides = {},
  props = {},
  threadContext = undefined,
} = {}) => {
  const client = { off: jest.fn(), on: jest.fn(), user: alice, userID: alice.id };
  const thread = createThread(alice);
  const channel = createChannel(channelOverrides);

  useChatViewContext.mockReturnValue({
    activeChatView,
    setActiveChatView: jest.fn(),
  });
  useThreadContext.mockReturnValue(threadContext);

  return render(
    <ChatProvider
      value={{
        client,
        closeMobileNav: jest.fn(),
        latestMessageDatesByChannels: {},
        navOpen: false,
        openMobileNav: jest.fn(),
      }}
    >
      <ChannelStateProvider value={{ channel, thread }}>
        <TranslationProvider
          value={{
            t: (key, options) => {
              if (key === 'Thread') return 'Thread';
              if (key === 'replyCount') return `${options.count} replies`;
              if (key === 'aria/Close thread') return 'Close thread';

              return key;
            },
          }}
        >
          <ThreadHeader closeThread={jest.fn()} thread={thread} {...props} />
        </TranslationProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
};

describe('ThreadHeader', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the channel display title in the subtitle', () => {
    useChannelPreviewInfo.mockReturnValue({ displayTitle: 'Bob' });

    renderComponent();

    expect(screen.getByText('Bob · 2 replies')).toBeInTheDocument();
  });

  it('falls back to the parent message author when the channel has no display title', () => {
    useChannelPreviewInfo.mockReturnValue({ displayTitle: undefined });

    renderComponent({
      channelOverrides: {
        state: {
          members: {
            [alice.id]: { user: alice },
          },
        },
      },
      props: {
        thread: createThread(alice),
      },
    });

    expect(screen.getByText('Alice · 2 replies')).toBeInTheDocument();
  });

  it('renders only the reply count when no title source is available', () => {
    useChannelPreviewInfo.mockReturnValue({ displayTitle: undefined });

    renderComponent({
      channelOverrides: {
        state: {
          members: {
            [alice.id]: { user: alice },
          },
        },
      },
      props: {
        thread: createThread({ id: 'alice' }),
      },
    });

    expect(screen.getByText('2 replies')).toBeInTheDocument();
    expect(screen.queryByText(/^undefined ·/)).not.toBeInTheDocument();
  });

  it('does not render the sidebar toggle in the channels view', () => {
    useChannelPreviewInfo.mockReturnValue({ displayTitle: 'Bob' });

    renderComponent({
      activeChatView: 'channels',
      threadContext: { id: 'thread-1' },
    });

    expect(screen.queryByTestId('toggle-sidebar-button')).not.toBeInTheDocument();
  });

  it('renders the sidebar toggle in the threads view', () => {
    useChannelPreviewInfo.mockReturnValue({ displayTitle: 'Bob' });

    renderComponent({
      activeChatView: 'threads',
      threadContext: { id: 'thread-1' },
    });

    expect(screen.getByTestId('toggle-sidebar-button')).toBeInTheDocument();
  });
});
