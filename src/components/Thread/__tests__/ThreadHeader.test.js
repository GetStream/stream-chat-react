import '@testing-library/jest-dom';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { useChannelDisplayName } from '../../ChannelPreview/hooks/useChannelDisplayName';
import { ThreadHeader } from '../ThreadHeader';

jest.mock('../../ChannelPreview/hooks/useChannelDisplayName', () => ({
  useChannelDisplayName: jest.fn(),
}));

jest.mock('../../Threads', () => ({
  useThreadContext: jest.fn(() => undefined),
}));

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

const renderComponent = ({ channelOverrides = {}, props = {} } = {}) => {
  const client = { off: jest.fn(), on: jest.fn(), userID: alice.id };
  const thread = createThread(alice);
  const channel = createChannel(channelOverrides);

  return render(
    <ChatProvider value={{ client, latestMessageDatesByChannels: {} }}>
      <ChannelStateProvider value={{ channel }}>
        <TranslationProvider
          value={{
            t: (key, options) => {
              if (key === 'Thread') return 'Thread';
              if (key === 'replyCount') return `${options.count} replies`;
              if (key === 'Direct message') return 'Direct message';
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

  it('renders the channel display title in the subtitle', async () => {
    useChannelDisplayName.mockReturnValue('Bob');

    await renderComponent();

    expect(screen.getByText('Bob · 2 replies')).toBeInTheDocument();
  });

  it('falls back to the parent message author when the channel has no display title', async () => {
    useChannelDisplayName.mockReturnValue(undefined);

    await renderComponent({
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

  it('renders only the reply count when no title source is available', async () => {
    useChannelDisplayName.mockReturnValue(undefined);

    await renderComponent({
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
});
