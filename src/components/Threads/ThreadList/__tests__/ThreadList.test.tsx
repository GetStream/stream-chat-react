import React from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { ThreadList } from '../ThreadList';
import { initClientWithChannels } from '../../../../mock-builders';

const mockUseChatContext = vi.fn();
const mockUseComponentContext = vi.fn();
const mockUseTranslationContext = vi.fn();
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
  useTranslationContext: () => mockUseTranslationContext(),
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
  // MERGE-RECONCILE (test migration): the ThreadList effects now call real ThreadManager APIs
  // (`client.threads.state.getLatestValue()`, `partialNext`, `reload`). Use a real StreamChat
  // client (via initClientWithChannels) so `client.threads.state` is a genuine StateStore rather
  // than hand-mocking `client.threads`. `useStateStore` stays mocked to drive isLoading/threads,
  // and `client.threads.reload` is stubbed to avoid a network call in the mount effect.
  let client: StreamChat;

  beforeEach(async () => {
    ({ client } = await initClientWithChannels());
    vi.spyOn(client.threads, 'reload').mockResolvedValue(undefined);
    mockUseChatContext.mockReturnValue({ client });
    mockUseComponentContext.mockReturnValue({});
    mockUseTranslationContext.mockReturnValue({ t: (value: string) => value });
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
    expect(mockVirtuoso).toHaveBeenCalledTimes(1);
    expect(mockVirtuoso.mock.calls[0][0]).toMatchObject({
      'aria-label': 'aria/Thread list',
      role: 'listbox',
    });
  });
});
