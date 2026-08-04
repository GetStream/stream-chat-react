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

// MERGE-RECONCILE (test migration): useMarkRead was rewritten (PR #2909). It no longer receives
// `markRead`/`setChannelUnreadUiState` from the removed ChannelActionContext, and the manual
// `setChannelUnreadUiState` unread-UI-state mechanism was removed entirely (unread state is now
// driven by `channel.messagePaginator.unreadStateSnapshot`). Marking read now goes through
// `client.messageDeliveryReporter.throttledMarkRead(channel | thread)`, so assertions spy on that.
// The `wasMarkedUnread` param was removed; "was marked unread" is now expressed by seeding
// `channel.messagePaginator.setUnreadSnapshot({ firstUnreadMessageId })`. Tests that only exercised
// the removed `setChannelUnreadUiState` unread-count / last_read bookkeeping were dropped as obsolete.

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

const readLastMessageChannelData = () => {
  const user = generateUser();
  const messages = [
    generateMessage({ created_at: new Date(1) }),
    generateMessage({ created_at: new Date(2) }),
  ];
  return {
    channel: { config: { read_events: true } },
    messages,
    read: [
      {
        last_read: new Date(2).toISOString(),
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
});
