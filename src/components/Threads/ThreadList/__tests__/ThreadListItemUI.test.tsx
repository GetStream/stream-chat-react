import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { axe } from '../../../../../axe-helper';

import { ThreadListItemUI } from '../ThreadListItemUI';
import { mockT } from '../../../../mock-builders/translator';

const { announceInteraction } = vi.hoisted(() => ({ announceInteraction: vi.fn() }));

vi.mock('../../../Accessibility', () => ({
  useInteractionAnnouncements: () => ({
    announceInteraction,
    cancelInteraction: vi.fn(),
  }),
}));

const mockUseChatContext = vi.fn();
const mockUseTranslationContext = vi.fn();
const mockUseStateStore = vi.fn();
const mockOpenThread = vi.fn();
const mockIsThreadActive = vi.fn();
const mockUseThreadListItemContext = vi.fn();
const mockUseChannelPreviewInfo = vi.fn();

// Active state and selection now come from the workspace navigation adapter:
// `isThreadActive(id)` drives the selected state; clicking opens the thread via `openThread`.
vi.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useComponentContext: () => ({}),
  useTranslationContext: () => mockUseTranslationContext(),
  useWorkspaceNavigation: () => ({
    isThreadActive: mockIsThreadActive,
    openThread: mockOpenThread,
  }),
}));

vi.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
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
  useLatestMessagePreview: ({
    latestMessage,
  }: {
    latestMessage?: { text?: string };
  }) => ({
    senderName: undefined,
    text: latestMessage?.text ?? '',
    type: 'text',
  }),
}));

describe('ThreadListItemUI', () => {
  const thread = { id: 'thread-1', messagePaginator: { state: {} }, state: {} };

  beforeEach(() => {
    mockUseChatContext.mockReturnValue({ client: { userID: 'martin' } });
    mockUseTranslationContext.mockReturnValue({
      t: mockT,
      tDateTimeParser: () => 'recently',
      userLanguage: 'en',
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

  it('marks the item selected when the thread is active in the workspace', () => {
    mockIsThreadActive.mockReturnValue(true);

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the item not selected when the thread is not active', () => {
    mockIsThreadActive.mockReturnValue(false);

    render(<ThreadListItemUI />);

    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });

  it('composes the row aria-label from the thread parts', () => {
    mockIsThreadActive.mockReturnValue(true);
    mockUseStateStore.mockReturnValue({
      channel: {},
      deletedAt: undefined,
      latestReply: undefined,
      ownUnreadMessageCount: 2,
      parentMessage: { text: 'hello world' },
      participants: [],
      replyCount: 3,
    });

    render(<ThreadListItemUI />);

    const label = screen.getByRole('option').getAttribute('aria-label') ?? '';
    expect(label).toContain('General');
    expect(label).toContain('2 unread message');
    expect(label).toContain('Thread: hello world');
    expect(label).toContain('3 replies');
    // Active row announces its state in the name (since aria-selected is unreliable for SR).
    expect(label).toContain('Active');
  });

  it('lets accessibleLabelConfig override the composed aria-label', () => {
    mockIsThreadActive.mockReturnValue(false);

    render(
      <ThreadListItemUI accessibleLabelConfig={{ build: () => 'Custom thread label' }} />,
    );

    expect(screen.getByRole('option')).toHaveAttribute(
      'aria-label',
      'Custom thread label',
    );
  });

  it('opens the thread and announces it on selection', () => {
    mockIsThreadActive.mockReturnValue(false);

    render(<ThreadListItemUI />);
    fireEvent.click(screen.getByRole('option'));

    expect(mockOpenThread).toHaveBeenCalledWith(thread, { additive: false });
    expect(announceInteraction).toHaveBeenCalledWith('thread.opened', {
      name: 'General',
    });
  });

  it('does not re-announce when the already-active thread is re-selected', () => {
    mockIsThreadActive.mockReturnValue(true);

    render(<ThreadListItemUI />);
    fireEvent.click(screen.getByRole('option'));

    // Re-selecting still routes through openThread (idempotent), but must not re-announce.
    expect(mockOpenThread).toHaveBeenCalledWith(thread, { additive: false });
    expect(announceInteraction).not.toHaveBeenCalled();
  });

  it('passes axe checks in listbox context', async () => {
    mockIsThreadActive.mockReturnValue(true);

    const { container } = render(
      <div aria-label='Thread list' role='listbox'>
        <ThreadListItemUI />
      </div>,
    );

    const results = await axe(container.firstChild as Element);

    expect(results).toHaveNoViolations();
  });
});
