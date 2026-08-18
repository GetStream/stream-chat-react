import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, LocalMessage, Thread } from 'stream-chat';

import { ChannelInstanceProvider, ChatProvider } from '../../../context';
import type { ChatContextValue } from '../../../context';
import { TranslationProvider } from '../../../context/TranslationContext';
import type { TranslationContextValue } from '../../../context/TranslationContext';
import { ThreadHeader } from '../ThreadHeader';

// MERGE-RECONCILE (test migration): ThreadHeader moved off the deleted ChannelStateContext.
// It now resolves the channel via useChannel() (ChannelInstanceContext), the reply count from
// the (optional) thread instance in ThreadContext, and the channel title from
// useChannelPreviewInfo. The subtitle fallback is the parent message author's name. We seed a
// ChannelInstanceProvider channel and mock the composer controller / store so the header renders
// without a fully initialized <Channel>. Assertions are unchanged.

vi.mock('../../ChannelListItem/hooks/useChannelPreviewInfo', () => ({
  useChannelPreviewInfo: vi.fn(() => ({ displayTitle: undefined })),
}));

vi.mock('../../../store', () => ({
  useStateStore: vi.fn(() => undefined),
}));

vi.mock('../../MessageComposer/hooks/useMessageComposerController', () => ({
  useMessageComposerController: vi.fn(() => fromPartial({})),
}));

vi.mock('../../TypingIndicator/TypingIndicatorHeader', () => ({
  TypingIndicatorHeader: () => <div>Typing...</div>,
}));

vi.mock('../../Threads', () => ({
  useThreadContext: vi.fn(() => undefined),
}));

vi.mock('../../../plugins/SlotLayout', () => ({
  useChatViewContext: vi.fn(() => ({ activeView: 'channels' })),
  useSlotForKind: vi.fn(() => undefined),
}));

import { useChannelPreviewInfo } from '../../ChannelListItem/hooks/useChannelPreviewInfo';
import { useChatViewContext } from '../../../plugins/SlotLayout';
import { useThreadContext } from '../../Threads';
import { mockT } from '../../../mock-builders/translator';

const alice = { id: 'alice', name: 'Alice' };

const createThread = (user) => ({
  id: `${user?.id ?? 'thread'}-message`,
  reply_count: 2,
  user,
});

const renderComponent = ({
  activeView = 'channels',
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
  const channel = fromPartial<Channel>({ cid: 'messaging:thread-header-test' });

  vi.mocked(useChatViewContext).mockReturnValue(
    fromPartial<ReturnType<typeof useChatViewContext>>({
      activeView,
      setActiveView: vi.fn(),
    }),
  );
  vi.mocked(useThreadContext).mockReturnValue(threadContext as Thread | undefined);

  return render(
    <ChatProvider
      value={fromPartial<ChatContextValue>({
        client,
        latestMessageDatesByChannels: {},
      })}
    >
      <ChannelInstanceProvider value={{ channel }}>
        <TranslationProvider
          value={fromPartial<TranslationContextValue>({
            t: mockT as TranslationContextValue['t'],
          })}
        >
          <ThreadHeader
            closeThread={vi.fn()}
            thread={thread as unknown as LocalMessage}
            {...props}
          />
        </TranslationProvider>
      </ChannelInstanceProvider>
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
      props: {
        thread: createThread({ id: 'alice' }),
      },
    });

    expect(screen.getByText('2 replies')).toBeInTheDocument();
    expect(screen.queryByText(/^undefined ·/)).not.toBeInTheDocument();
  });
});
