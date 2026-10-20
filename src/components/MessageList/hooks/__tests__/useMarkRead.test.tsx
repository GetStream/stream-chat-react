import React from 'react';
import { renderHook } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';
import { useMarkRead } from '../useMarkRead';
import { Chat } from '../../../../components/Chat';
import { Channel as ChannelComponent } from '../../../../components/Channel';
import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../../mock-builders';
import { act } from 'react';
import { convertDateToTimestamp } from '../../../../mock-builders';

// Marking read goes through `client.messageDeliveryReporter.throttledMarkRead`, so assertions spy
// on that. "Was marked unread" is seeded with `channel.messagePaginator.setUnreadSnapshot`.

const visibilityChangeScenario = 'visibilitychange event';

const render = async ({
  channel,
  client,
  params,
  wasMarkedUnread = false,
}: {
  channel: Channel;
  client: StreamChat;
  params: Parameters<typeof useMarkRead>[0];
  wasMarkedUnread?: boolean;
}) => {
  if (wasMarkedUnread) {
    channel.messagePaginator.setUnreadSnapshot({
      firstUnreadMessageId: 'unread-message-id',
    });
  }
  const markRead = vi
    .spyOn(client.messageDeliveryReporter, 'throttledMarkRead')
    .mockImplementation(() => undefined);
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <ChannelComponent channel={channel}>{children}</ChannelComponent>
    </Chat>
  );
  // eslint-disable-next-line require-await
  await act(async () => {
    renderHook(() => useMarkRead(params), { wrapper });
  });
  return { markRead };
};

const unreadLastMessageChannelData = () => {
  const user = generateUser();
  const messages = [
    generateMessage({ created_at: convertDateToTimestamp(new Date(1)) }),
    generateMessage({ created_at: convertDateToTimestamp(new Date(2)) }),
  ];
  return {
    messages,
    read: [
      {
        last_read: convertDateToTimestamp(new Date(1).toISOString()),
        last_read_message_id: messages[0].id,
        unread_messages: 1,
        user,
      },
    ],
  };
};

const readLastMessageChannelData = () => {
  const user = generateUser();
  const messages = [
    generateMessage({ created_at: convertDateToTimestamp(new Date(1)) }),
    generateMessage({ created_at: convertDateToTimestamp(new Date(2)) }),
  ];
  return {
    channel: { config: { read_events: true } },
    messages,
    read: [
      {
        last_read: convertDateToTimestamp(new Date(2).toISOString()),
        last_read_message_id: messages[1].id,
        unread_messages: 0,
        user,
      },
    ],
  };
};

const emptyChannelData = () => {
  const user = generateUser();
  return {
    messages: [],
    read: [
      {
        last_read: undefined,
        last_read_message_id: undefined,
        unread_messages: 0,
        user,
      },
    ],
  };
};

describe('useMarkRead', () => {
  const shouldMarkReadParams = {
    isMessageListScrolledToBottom: true,
    messageListIsThread: false,
  };

  beforeEach(vi.clearAllMocks);
  afterEach(vi.restoreAllMocks);

  describe.each([[visibilityChangeScenario], ['render']])('on %s', (scenario) => {
    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread with unread messages', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        await act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(markRead).toHaveBeenCalledTimes(2);
      } else {
        expect(markRead).toHaveBeenCalledTimes(1);
      }
    });

    it('should not mark channel read from non-thread message list scrolled to the bottom previously marked unread with unread messages', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
        wasMarkedUnread: true,
      });
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark channel read from non-thread message list scrolled to the bottom not previously marked unread with 0 unread messages', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        await act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark empty channel read', async () => {
      const channelData = emptyChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        await act(() => {
          document.dispatchEvent(new Event('visibilitychange'));
        });
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark channel read from message list not scrolled to the bottom', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      const { markRead } = await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          isMessageListScrolledToBottom: false,
        },
      });

      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read from thread message list', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      const { markRead } = await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          messageListIsThread: true,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).not.toHaveBeenCalled();
    });

    // A thresholded at-bottom flag can read true while the last message is partly clipped.
    // `isViewingLive` gates marking read and the LLC's own-unread bump, so it must stay false then.
    it('does not report viewing live while the last message is not fully shown', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          isAtTrueBottom: false,
        },
      });

      expect(channel.messagePaginator.isViewingLive).toBe(false);
    });

    it('reports viewing live once the last message is fully shown', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          isAtTrueBottom: true,
        },
      });

      expect(channel.messagePaginator.isViewingLive).toBe(true);
    });

    // Scrolling the last few pixels flips `isAtTrueBottom` but not the thresholded at-bottom flag,
    // so the catch-up must re-run the mark-read check on that change alone.
    it('marks read when the last message finally becomes fully shown', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const markRead = vi
        .spyOn(client.messageDeliveryReporter, 'throttledMarkRead')
        .mockImplementation(() => undefined);
      const wrapper = ({ children }: React.PropsWithChildren) => (
        <Chat client={client}>
          <ChannelComponent channel={channel}>{children}</ChannelComponent>
        </Chat>
      );

      let view: ReturnType<typeof renderHook>;
      // eslint-disable-next-line require-await
      await act(async () => {
        view = renderHook(
          ({ isAtTrueBottom }: { isAtTrueBottom: boolean }) =>
            useMarkRead({ ...shouldMarkReadParams, isAtTrueBottom }),
          { initialProps: { isAtTrueBottom: false }, wrapper },
        );
      });

      expect(channel.messagePaginator.isViewingLive).toBe(false);
      const callsWhileClipped = markRead.mock.calls.length;

      // eslint-disable-next-line require-await
      await act(async () => {
        view.rerender({ isAtTrueBottom: true });
      });

      expect(channel.messagePaginator.isViewingLive).toBe(true);
      expect(markRead.mock.calls.length).toBeGreaterThan(callsWhileClipped);
    });
  });

  describe('on message.new', () => {
    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread with unread messages', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(2);
    });

    it('should mark channel read for own messages when scrolled to bottom in main message list', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(
          client,
          generateMessage({ user: channelData.read[0].user }),
          channel,
        );
      });

      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread with originally 0 unread messages', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('should mark originally empty channel read', async () => {
      const channelData = emptyChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('should not mark channel read from non-thread message list scrolled to the bottom previously marked unread', async () => {
      const channelData = unreadLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
        wasMarkedUnread: true,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read from message list not scrolled to the bottom', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          isMessageListScrolledToBottom: false,
        },
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read if the read events are disabled', async () => {
      const channelData = {
        ...readLastMessageChannelData(),
        channel: { config: { read_events: false } },
      };
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          isMessageListScrolledToBottom: false,
        },
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read from thread message list', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          messageListIsThread: true,
        },
      });
      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read for messages incoming to other channels', async () => {
      const channelData = readLastMessageChannelData();
      const {
        channels: [activeChannel, otherChannel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData, generateChannel()],
        customUser: channelData.read[0].user,
      });

      const { markRead } = await render({
        channel: activeChannel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), otherChannel);
      });

      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read for thread messages', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage({ parent_id: 'X' }), channel);
      });

      expect(markRead).not.toHaveBeenCalled();
    });

    it('should mark channel read for thread messages with event.show_in_channel enabled', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      const { markRead } = await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(
          client,
          generateMessage({ parent_id: 'X', show_in_channel: true }),
          channel,
        );
      });

      expect(markRead).toHaveBeenCalledTimes(1);
    });
  });

  // Such a channel has no server-side read state; one that counts unread locally still needs the
  // catch-up, which the LLC resets locally instead of requesting.
  describe('channel with read events disabled', () => {
    const renderWithLocalUnreadCount = async (localUnreadCountEnabled: boolean) => {
      const channelData = {
        ...unreadLastMessageChannelData(),
        channel: { config: { read_events: false } },
      };
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [channelData],
        customUser: channelData.read[0].user,
      });
      channel.configState.partialNext({
        readEvents: { ...channel.config.readEvents, localUnreadCountEnabled },
      });

      return render({ channel, client, params: shouldMarkReadParams });
    };

    it('marks read when the channel counts unread locally', async () => {
      const { markRead } = await renderWithLocalUnreadCount(true);

      expect(markRead).toHaveBeenCalledTimes(1);
    });

    it('does not mark read otherwise', async () => {
      const { markRead } = await renderWithLocalUnreadCount(false);

      expect(markRead).not.toHaveBeenCalled();
    });
  });
});
