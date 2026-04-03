import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, LocalMessage, Thread } from 'stream-chat';

import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import type { ChatContextValue } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { mockChannelStateContext } from '../../../mock-builders';
import { ThreadHeader } from '../ThreadHeader';

vi.mock('../../ChannelListItem/hooks/useChannelPreviewInfo', () => ({
  useChannelPreviewInfo: vi.fn(() => ({ displayTitle: undefined })),
}));

vi.mock('../../../store', () => ({
  useStateStore: vi.fn(() => undefined),
}));

vi.mock('../../../context/TypingContext', () => ({
  useTypingContext: vi.fn(() => ({ typing: {} })),
}));

vi.mock('../../TypingIndicator/TypingIndicatorHeader', () => ({
  TypingIndicatorHeader: () => <div>Typing...</div>,
}));

vi.mock('../../Threads', () => ({
  useThreadContext: vi.fn(() => undefined),
}));

vi.mock('../../ChatView', () => ({
  useChatViewContext: vi.fn(() => ({ activeChatView: 'channels' })),
}));

import { useChannelPreviewInfo } from '../../ChannelListItem/hooks/useChannelPreviewInfo';
import { useChatViewContext } from '../../ChatView';
import { useThreadContext } from '../../Threads';

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
  const client = fromPartial<ChatContextValue['client']>({
    off: vi.fn(),
    on: vi.fn(),
    user: alice,
    userID: alice.id,
  });
  const thread = createThread(alice);
  const channel = createChannel(channelOverrides) as unknown as Channel;

  vi.mocked(useChatViewContext).mockReturnValue(
    fromPartial<ReturnType<typeof useChatViewContext>>({
      activeChatView,
      setActiveChatView: vi.fn(),
    }),
  );
  vi.mocked(useThreadContext).mockReturnValue(threadContext as Thread | undefined);

  return render(
    <ChatProvider
      value={fromPartial<ChatContextValue>({
        client,
        closeMobileNav: vi.fn(),
        latestMessageDatesByChannels: {},
        navOpen: false,
        openMobileNav: vi.fn(),
      })}
    >
      <ChannelStateProvider value={mockChannelStateContext({ channel, thread })}>
        <TranslationProvider
          value={fromPartial<TranslationContextValue>({
            t: ((key: string, options?: Record<string, unknown>) => {
              if (key === 'Thread') return 'Thread';
              if (key === 'replyCount')
                return `${(options as Record<string, number>)?.count} replies`;
              if (key === 'aria/Close thread') return 'Close thread';

              return key;
            }) as TranslationContextValue['t'],
          })}
        >
          <ThreadHeader
            closeThread={vi.fn()}
            thread={thread as unknown as LocalMessage}
            {...props}
          />
        </TranslationProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
};

describe('ThreadHeader', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the channel display title in the subtitle', () => {
    vi.mocked(useChannelPreviewInfo).mockReturnValue(
      fromPartial({ displayTitle: 'Bob' }),
    );

    renderComponent();

    expect(screen.getByText('Bob · 2 replies')).toBeInTheDocument();
  });

  it('falls back to the parent message author when the channel has no display title', () => {
    vi.mocked(useChannelPreviewInfo).mockReturnValue(
      fromPartial({ displayTitle: undefined }),
    );

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
    vi.mocked(useChannelPreviewInfo).mockReturnValue(
      fromPartial({ displayTitle: undefined }),
    );

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
});
