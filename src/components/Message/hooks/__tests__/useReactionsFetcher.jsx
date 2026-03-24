import { renderHook } from '@testing-library/react';
import React from 'react';

import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  getTestClient,
} from '../../../../mock-builders';
import { useReactionsFetcher } from '../useReactionsFetcher';

function renderUseReactionsFetcherHook(client = getTestClient(), notificationOpts) {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel: generateChannel() }}>
        {children}
      </ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(
    () => useReactionsFetcher(generateMessage(), notificationOpts),
    {
      wrapper,
    },
  );
  return result.current;
}

describe('useReactionsFetcher custom hook', () => {
  afterEach(() => vi.clearAllMocks());

  it('should generate a function', () => {
    const fetchReactions = renderUseReactionsFetcherHook();
    expect(typeof fetchReactions).toBe('function');
  });

  it('generated function should make a request to fetch reactions', async () => {
    const queryReactionsMock = vi.fn(() => Promise.resolve({ reactions: [] }));
    const client = getTestClient({ queryReactions: queryReactionsMock });
    const fetchReactions = renderUseReactionsFetcherHook(client);
    await fetchReactions();
    expect(queryReactionsMock).toHaveBeenCalledTimes(1);
  });

  it('generated function should make paged requests to fetch reactions', async () => {
    const queryReactionsMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.resolve({ next: '42', reactions: Array(20) }))
      .mockImplementationOnce(() => Promise.resolve({ reactions: Array(20) }));
    const client = getTestClient({ queryReactions: queryReactionsMock });
    const fetchReactions = renderUseReactionsFetcherHook(client);
    await fetchReactions();
    expect(queryReactionsMock).toHaveBeenCalledTimes(2);
  });

  it('generated function should notify about errors', async () => {
    const queryReactionsMock = vi.fn(() => Promise.reject());
    const client = getTestClient({ queryReactions: queryReactionsMock });
    const getErrorNotificationMock = vi.fn(() => 'Error message');
    const notifyMock = vi.fn();
    const fetchReactions = renderUseReactionsFetcherHook(client, {
      getErrorNotification: getErrorNotificationMock,
      notify: notifyMock,
    });

    await fetchReactions().catch(() => {});

    expect(getErrorNotificationMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith('Error message', 'error');
  });
});
