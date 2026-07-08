import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { axe } from '../../../../../axe-helper';

import { ThreadListItemUI } from '../ThreadListItemUI';

const mockUseChatContext = vi.fn();
const mockUseTranslationContext = vi.fn();
const mockUseStateStore = vi.fn();
const mockUseLayoutViewState = vi.fn();
const mockOpen = vi.fn();
const mockUseThreadListItemContext = vi.fn();
const mockUseChannelPreviewInfo = vi.fn();

vi.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useTranslationContext: () => mockUseTranslationContext(),
}));

vi.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
}));

// Active state now comes from the ChatView slot bindings (a thread bound in a slot),
// not a ThreadsViewContext; selection opens the thread into a slot via `open`.
vi.mock('../../../ChatView', () => ({
  getChatViewEntityBinding: (binding) => binding,
  useChatViewNavigation: () => ({ open: mockOpen }),
}));

vi.mock('../../../ChatView/hooks/useLayoutViewState', () => ({
  useLayoutViewState: () => mockUseLayoutViewState(),
}));

vi.mock('../ThreadListItem', () => ({
  useThreadListItemContext: () => mockUseThreadListItemContext(),
}));

vi.mock('../../../ChannelListItem', () => ({
  useChannelPreviewInfo: (...args) => mockUseChannelPreviewInfo(...args),
}));

vi.mock('../../../Avatar', () => ({
  Avatar: () => <span data-testid='avatar' />,
  AvatarStack: () => <span data-testid='avatar-stack' />,
}));

vi.mock('../../../Message/Timestamp', () => ({
  Timestamp: () => <span data-testid='timestamp' />,
}));

vi.mock('../../../Badge', () => ({
  Badge: ({ children }) => <span>{children}</span>,
}));

vi.mock('../../../SummarizedMessagePreview', () => ({
  SummarizedMessagePreview: () => <span data-testid='summary' />,
}));

// Bind (or not) `thread-1` into the `main-thread` slot to drive the active state.
const bindThread = (id?: string) => ({
  availableSlots: id ? ['main-thread'] : [],
  slotBindings: id ? { 'main-thread': { kind: 'thread', source: { id } } } : {},
});

describe('ThreadListItemUI', () => {
  const thread = { id: 'thread-1', state: {} };

  beforeEach(() => {
    mockUseChatContext.mockReturnValue({ client: { userID: 'martin' } });
    mockUseTranslationContext.mockReturnValue({
      t: (key: string, values?: { count?: number }) =>
        key === 'replyCount' ? `${values?.count ?? 0} replies` : key,
    });
    mockUseThreadListItemContext.mockReturnValue(thread);
    mockUseChannelPreviewInfo.mockReturnValue({ displayTitle: 'General' });
    mockUseStateStore.mockReturnValue({
      channel: {},
      deletedAt: undefined,
      latestReply: undefined,
      ownUnreadMessageCount: 0,
      parentMessage: undefined,
      participants: [],
      replyCount: 1,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('marks the item selected when the thread is bound in a slot', () => {
    mockUseLayoutViewState.mockReturnValue(bindThread('thread-1'));

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the item not selected when a different thread is bound', () => {
    mockUseLayoutViewState.mockReturnValue(bindThread('thread-2'));

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });

  it('passes axe checks in listbox context', async () => {
    mockUseLayoutViewState.mockReturnValue(bindThread('thread-1'));

    const { container } = render(
      <div aria-label='Thread list' role='listbox'>
        <ThreadListItemUI />
      </div>,
    );

    const results = await axe(container.firstChild as Element);

    expect(results).toHaveNoViolations();
  });
});
