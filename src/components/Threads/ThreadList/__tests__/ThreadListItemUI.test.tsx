import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { axe } from '../../../../../axe-helper';

import { ThreadListItemUI } from '../ThreadListItemUI';

const mockUseChatContext = vi.fn();
const mockUseTranslationContext = vi.fn();
const mockUseStateStore = vi.fn();
const mockUseThreadsViewContext = vi.fn();
const mockUseThreadListItemContext = vi.fn();
const mockUseChannelPreviewInfo = vi.fn();

vi.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useTranslationContext: () => mockUseTranslationContext(),
}));

vi.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
}));

vi.mock('../../../ChatView', () => ({
  useThreadsViewContext: () => mockUseThreadsViewContext(),
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

  it('uses aria-selected=true when the thread is active', () => {
    mockUseThreadsViewContext.mockReturnValue({
      activeThread: thread,
      setActiveThread: vi.fn(),
    });

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses aria-selected=false when the thread is not active', () => {
    mockUseThreadsViewContext.mockReturnValue({
      activeThread: { id: 'thread-2' },
      setActiveThread: vi.fn(),
    });

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });

  it('passes axe checks in listbox context', async () => {
    mockUseThreadsViewContext.mockReturnValue({
      activeThread: thread,
      setActiveThread: vi.fn(),
    });

    const { container } = render(
      <div aria-label='Thread list' role='listbox'>
        <ThreadListItemUI />
      </div>,
    );

    const results = await axe(container.firstChild as Element);

    expect(results).toHaveNoViolations();
  });
});
