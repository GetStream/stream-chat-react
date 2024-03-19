import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import { generateChannel, generateMessage, getTestClient } from '../../../../mock-builders';
import { useReactionsFetcher } from '../useReactionsFetcher';

async function renderUseReactionsFetcherHook(channel = generateChannel(), notificationOpts) {
  const client = await getTestClient();
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>{children}</ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useReactionsFetcher(generateMessage(), notificationOpts), {
    wrapper,
  });
  return result.current;
}

describe('useReactionsFetcher custom hook', () => {
  afterEach(() => jest.clearAllMocks());

  it('should generate a function', async () => {
    const fetchReactions = await renderUseReactionsFetcherHook();
    expect(typeof fetchReactions).toBe('function');
  });

  it('generated function should make a request to fetch reactions', async () => {
    const getReactionsMock = jest.fn(() => Promise.resolve({ reactions: [] }));
    const channel = generateChannel({
      getReactions: getReactionsMock,
    });
    const fetchReactions = await renderUseReactionsFetcherHook(channel);
    await fetchReactions();
    expect(getReactionsMock).toHaveBeenCalledTimes(1);
  });

  it('generated function should make paged requests to fetch reactions', async () => {
    const getReactionsMock = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({ reactions: Array(300) }))
      .mockImplementationOnce(() => Promise.resolve({ reactions: [] }));
    const channel = generateChannel({
      getReactions: getReactionsMock,
    });
    const fetchReactions = await renderUseReactionsFetcherHook(channel);
    await fetchReactions();
    expect(getReactionsMock).toHaveBeenCalledTimes(2);
  });

  it('generated function should notify about errors', async () => {
    const getReactionsMock = jest.fn(() => Promise.reject());
    const channel = generateChannel({
      getReactions: getReactionsMock,
    });
    const getErrorNotificationMock = jest.fn(() => 'Error message');
    const notifyMock = jest.fn();
    const fetchReactions = await renderUseReactionsFetcherHook(channel, {
      getErrorNotification: getErrorNotificationMock,
      notify: notifyMock,
    });

    await fetchReactions().catch(() => {});

    expect(getErrorNotificationMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith('Error message', 'error');
  });
});
