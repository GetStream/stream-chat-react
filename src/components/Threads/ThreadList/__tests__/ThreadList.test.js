import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ThreadList } from '../ThreadList';

const mockUseChatContext = jest.fn();
const mockUseComponentContext = jest.fn();
const mockUseStateStore = jest.fn();
const mockVirtuoso = jest.fn();

jest.mock('react-virtuoso', () => ({
  Virtuoso: (props) => {
    mockVirtuoso(props);
    return <div data-testid='virtuoso' />;
  },
}));

jest.mock('../../../../context', () => ({
  useChatContext: () => mockUseChatContext(),
  useComponentContext: () => mockUseComponentContext(),
}));

jest.mock('../../../../store', () => ({
  useStateStore: (...args) => mockUseStateStore(...args),
}));

jest.mock('../../../Loading', () => ({
  LoadingChannels: () => <div data-testid='loading-channels' />,
}));

jest.mock('../ThreadListHeader', () => ({
  ThreadListHeader: () => <div data-testid='thread-list-header' />,
}));

jest.mock('../ThreadListUnseenThreadsBanner', () => ({
  ThreadListUnseenThreadsBanner: () => <div data-testid='thread-list-unseen-banner' />,
}));

jest.mock('../../../Notifications', () => ({
  NotificationList: () => null,
}));

describe('ThreadList', () => {
  const mockClient = {
    notifications: {
      store: {
        getLatestValue: jest.fn(() => ({ notifications: [] })),
        subscribeWithSelector: jest.fn(() => jest.fn()),
      },
    },
    threads: {
      activate: jest.fn(),
      deactivate: jest.fn(),
      loadNextPage: jest.fn(),
      state: {
        subscribeWithSelector: jest.fn(() => jest.fn()),
      },
    },
  };

  beforeEach(() => {
    mockUseChatContext.mockReturnValue({ client: mockClient, navOpen: true });
    mockUseComponentContext.mockReturnValue({});
    mockUseStateStore.mockReturnValue({ isLoading: false, threads: [] });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
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
