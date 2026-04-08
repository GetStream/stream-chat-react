import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';

import { ThreadList } from '../ThreadList';

const mockUseChatContext = vi.fn();
const mockUseComponentContext = vi.fn();
const mockUseStateStore = vi.fn();
const mockVirtuoso = vi.fn();

vi.mock('react-virtuoso', () => ({
  Virtuoso: (props) => {
    mockVirtuoso(props);
    return <div data-testid='virtuoso' />;
  },
}));

vi.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useComponentContext: () => mockUseComponentContext(),
}));

vi.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
}));

vi.mock('../../../Loading', () => ({
  LoadingChannels: () => <div data-testid='loading-channels' />,
}));

vi.mock('../ThreadListHeader', () => ({
  ThreadListHeader: () => <div data-testid='thread-list-header' />,
}));

vi.mock('../ThreadListUnseenThreadsBanner', () => ({
  ThreadListUnseenThreadsBanner: () => <div data-testid='thread-list-unseen-banner' />,
}));

vi.mock('../../../Notifications', () => ({
  NotificationList: () => null,
}));

describe('ThreadList', () => {
  const mockClient = {
    notifications: {
      store: {
        getLatestValue: vi.fn(() => ({ notifications: [] })),
        subscribeWithSelector: vi.fn(() => vi.fn()),
      },
    },
    threads: {
      activate: vi.fn(),
      deactivate: vi.fn(),
      loadNextPage: vi.fn(),
      state: {
        subscribeWithSelector: vi.fn(() => vi.fn()),
      },
    },
  };

  beforeEach(() => {
    mockUseChatContext.mockReturnValue({ client: mockClient });
    mockUseComponentContext.mockReturnValue({});
    mockUseStateStore.mockReturnValue({ isLoading: false, threads: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders channel-list skeletons during the initial thread list load', () => {
    mockUseStateStore.mockReturnValue({ isLoading: true, threads: [] });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.getByTestId('loading-channels')).toBeInTheDocument();
    expect(screen.queryByTestId('thread-list-unseen-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
  });

  it('renders the virtualized thread list once the initial load is complete', () => {
    mockUseStateStore.mockReturnValue({
      isLoading: false,
      threads: [{ id: 'thread-1' }],
    });

    render(<ThreadList />);

    expect(screen.getByTestId('thread-list-header')).toBeInTheDocument();
    expect(screen.getByTestId('thread-list-unseen-banner')).toBeInTheDocument();
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-channels')).not.toBeInTheDocument();
  });
});
