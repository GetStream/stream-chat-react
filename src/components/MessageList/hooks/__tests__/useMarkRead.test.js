import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { useMarkRead } from '../useMarkRead';
import { ChannelInstanceProvider, ChatProvider } from '../../../../context';
import { ThreadProvider } from '../../../Threads/ThreadContext';
import {
  dispatchMessageNewEvent,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../../mock-builders';

const unreadLastMessageChannelData = () => {
  const user = generateUser();
  const messages = [
    generateMessage({ created_at: new Date(1) }),
    generateMessage({ created_at: new Date(2) }),
  ];
  return {
    messages,
    read: [
      {
        last_read: new Date(1).toISOString(),
        last_read_message_id: messages[0].id,
        unread_messages: 1,
        user,
      },
    ],
  };
};

const renderUseMarkRead = ({ channel, client, params, thread }) => {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelInstanceProvider value={{ channel }}>
        <ThreadProvider thread={thread}>{children}</ThreadProvider>
      </ChannelInstanceProvider>
    </ChatProvider>
  );

  renderHook(() => useMarkRead(params), { wrapper });
};

describe('useMarkRead', () => {
  it('uses messageDeliveryReporter.throttledMarkRead for channel lists', async () => {
    const channelData = unreadLastMessageChannelData();
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [channelData],
      customUser: channelData.read[0].user,
    });
    const throttledMarkReadSpy = jest.spyOn(
      client.messageDeliveryReporter,
      'throttledMarkRead',
    );

    renderUseMarkRead({
      channel,
      client,
      params: { isMessageListScrolledToBottom: true, messageListIsThread: false },
    });

    expect(throttledMarkReadSpy).toHaveBeenCalledWith(channel);
    expect(throttledMarkReadSpy).toHaveBeenCalledTimes(1);
  });

  it('does not mark read when unread snapshot indicates an explicit unread anchor', async () => {
    const channelData = unreadLastMessageChannelData();
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [channelData],
      customUser: channelData.read[0].user,
    });
    const throttledMarkReadSpy = jest.spyOn(
      client.messageDeliveryReporter,
      'throttledMarkRead',
    );

    channel.messagePaginator.unreadStateSnapshot.partialNext({
      firstUnreadMessageId: 'explicit-unread-anchor',
    });

    renderUseMarkRead({
      channel,
      client,
      params: { isMessageListScrolledToBottom: true, messageListIsThread: false },
    });

    expect(throttledMarkReadSpy).not.toHaveBeenCalled();
  });

  it('targets thread collection when thread context is present', async () => {
    const channelData = unreadLastMessageChannelData();
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [channelData],
      customUser: channelData.read[0].user,
    });
    const throttledMarkReadSpy = jest.spyOn(
      client.messageDeliveryReporter,
      'throttledMarkRead',
    );
    const thread = { id: 'parent-1', ownUnreadCount: 3 };

    renderUseMarkRead({
      channel,
      client,
      params: { isMessageListScrolledToBottom: true, messageListIsThread: true },
      thread,
    });

    expect(throttledMarkReadSpy).toHaveBeenCalledWith(thread);
    expect(throttledMarkReadSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores thread-only message.new in channel list unless show_in_channel is true', async () => {
    const channelData = unreadLastMessageChannelData();
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [channelData],
      customUser: channelData.read[0].user,
    });
    const throttledMarkReadSpy = jest.spyOn(
      client.messageDeliveryReporter,
      'throttledMarkRead',
    );

    renderUseMarkRead({
      channel,
      client,
      params: { isMessageListScrolledToBottom: true, messageListIsThread: false },
    });
    expect(throttledMarkReadSpy).toHaveBeenCalledTimes(1);

    act(() => {
      dispatchMessageNewEvent(
        client,
        generateMessage({ parent_id: 'thread-1', show_in_channel: false }),
        channel,
      );
    });
    expect(throttledMarkReadSpy).toHaveBeenCalledTimes(1);

    act(() => {
      dispatchMessageNewEvent(
        client,
        generateMessage({ parent_id: 'thread-1', show_in_channel: true }),
        channel,
      );
    });
    expect(throttledMarkReadSpy).toHaveBeenCalledTimes(2);
  });
});
