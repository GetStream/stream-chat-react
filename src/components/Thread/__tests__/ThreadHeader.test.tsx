import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';
import type { Channel, LocalMessage, Thread, ThreadState } from 'stream-chat';

import {
  ChannelInstanceProvider,
  ChatProvider,
  defaultWorkspaceNavigation,
  WorkspaceNavigationProvider,
} from '../../../context';
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

vi.mock('../../MessageComposer/hooks/useMessageComposerController', () => ({
  useMessageComposerController: vi.fn(() => fromPartial({})),
}));

vi.mock('../../TypingIndicator/TypingIndicatorHeader', () => ({
  TypingIndicatorHeader: () => <div>Typing...</div>,
}));

const closeThreadInContext = vi.fn();
vi.mock('../../Threads', () => ({
  useCloseThread: vi.fn(() => closeThreadInContext),
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

// The header reads the parent message and the reply count off the thread instance, so the
// fixture is a thread whose state carries both.
const createThreadInstance = (user?: { id: string; name?: string }) =>
  fromPartial<Thread>({
    id: `${user?.id ?? 'thread'}-message`,
    state: new StateStore<ThreadState>(
      fromPartial<ThreadState>({
        parentMessage: fromPartial<LocalMessage>({
          id: `${user?.id ?? 'thread'}-message`,
          reply_count: 2,
          user,
        }),
        replyCount: 2,
      }),
    ),
  });

const renderComponent = ({
  activeView = 'channels',
  dismissable = false,
  props = {},
  threadContext = createThreadInstance(alice),
}: {
  activeView?: string;
  dismissable?: boolean;
  props?: Partial<React.ComponentProps<typeof ThreadHeader>>;
  threadContext?: Thread;
} = {}) => {
  const client = fromPartial<ChatContextValue['client']>({
    off: vi.fn(),
    on: vi.fn(),
    user: alice,
    userID: alice.id,
  });
  const channel = fromPartial<Channel>({ cid: 'messaging:thread-header-test' });

  vi.mocked(useChatViewContext).mockReturnValue(
    fromPartial<ReturnType<typeof useChatViewContext>>({
      activeView,
      setActiveView: vi.fn(),
    }),
  );
  vi.mocked(useThreadContext).mockReturnValue(threadContext);

  return render(
    <ChatProvider
      value={fromPartial<ChatContextValue>({
        client,
      })}
    >
      <ChannelInstanceProvider value={{ channel }}>
        <WorkspaceNavigationProvider
          value={{
            ...defaultWorkspaceNavigation,
            isThreadDismissable: () => dismissable,
          }}
        >
          <TranslationProvider
            value={fromPartial<TranslationContextValue>({
              t: mockT as TranslationContextValue['t'],
            })}
          >
            <ThreadHeader {...props} />
          </TranslationProvider>
        </WorkspaceNavigationProvider>
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

    renderComponent({ threadContext: createThreadInstance(alice) });

    expect(screen.getByText('Alice · 2 replies')).toBeInTheDocument();
  });

  it('renders only the reply count when no title source is available', () => {
    vi.mocked(useChannelPreviewInfo).mockReturnValue(
      fromPartial({ displayTitle: undefined }),
    );

    renderComponent({ threadContext: createThreadInstance({ id: 'alice' }) });

    expect(screen.getByText('2 replies')).toBeInTheDocument();
    expect(screen.queryByText(/^undefined ·/)).not.toBeInTheDocument();
  });

  it('closes the thread in context when the close button is pressed', () => {
    // No prop carries the handler any more -- the header closes through the workspace navigation
    // the app configures centrally.
    renderComponent({ dismissable: true });

    fireEvent.click(screen.getByTestId('close-thread-button'));

    expect(closeThreadInContext).toHaveBeenCalledTimes(1);
  });

  it('renders no close button for a thread the workspace does not consider dismissable', () => {
    renderComponent({ dismissable: false });

    expect(screen.queryByTestId('close-thread-button')).not.toBeInTheDocument();
  });
});
