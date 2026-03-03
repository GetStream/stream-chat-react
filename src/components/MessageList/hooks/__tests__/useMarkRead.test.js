import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMarkRead } from '../useMarkRead';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
} from '../../../../context';
import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../../mock-builders';
import { act } from 'react';

const visibilityChangeScenario = 'visibilitychange event';
const markRead = jest.fn();
const setChannelUnreadUiState = jest.fn();

const render = ({ channel, client, params }) => {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>
        <ChannelActionProvider value={{ markRead, setChannelUnreadUiState }}>
          {children}
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
  );
  const { result } = renderHook(() => useMarkRead(params), { wrapper });
  return result.current;
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
    markReadOnScrolledToBottom: true,
    messageListIsThread: false,
    wasMarkedUnread: false,
  };

  beforeEach(jest.clearAllMocks);

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

      await render({
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

      await render({
        channel,
        client,
        params: { ...shouldMarkReadParams, wasMarkedUnread: true },
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

      await render({
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

      await render({
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

      await render({
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

      render({
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

      await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(2);
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
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

      await render({
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
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
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

      await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(1);
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
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

      await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(markRead).toHaveBeenCalledTimes(1);
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
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

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          wasMarkedUnread: true,
        },
      });

      let channelUnreadUiStateCb;
      setChannelUnreadUiState.mockImplementationOnce(
        (cb) => (channelUnreadUiStateCb = cb),
      );
      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
      const channelUnreadUiState = channelUnreadUiStateCb();
      expect(channelUnreadUiState.unread_messages).toBe(1);
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should mark channel read from message list not scrolled to the bottom', async () => {
      const channelData = readLastMessageChannelData();
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
          isMessageListScrolledToBottom: false,
        },
      });

      let channelUnreadUiStateCb;
      setChannelUnreadUiState.mockImplementationOnce(
        (cb) => (channelUnreadUiStateCb = cb),
      );
      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });
      expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
      const channelUnreadUiState = channelUnreadUiStateCb();
      expect(channelUnreadUiState.unread_messages).toBe(1);
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not increase unread count if the read events are disabled', async () => {
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

      await render({
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
      expect(setChannelUnreadUiState).toHaveBeenCalledTimes(0);
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

      render({
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
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
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

      await render({
        channel: activeChannel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), otherChannel);
      });

      expect(markRead).not.toHaveBeenCalled();
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
    });

    it('should not mark channel read for thread messages', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage({ parent_id: 'X' }), channel);
      });

      expect(markRead).not.toHaveBeenCalled();
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
    });

    it('should mark channel read for thread messages with event.show_in_channel enabled', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await render({
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
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
    });

    describe('update unread UI state unread_messages', () => {
      it('should be performed when message list is not scrolled to bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce(
          (cb) => (channelUnreadUiStateCb = cb),
        );
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await render({
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

        expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
        const channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.unread_messages).toBe(1);
      });

      it('should be performed when channel was marked unread and is scrolled to the bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce(
          (cb) => (channelUnreadUiStateCb = cb),
        );
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await render({
          channel,
          client,
          params: {
            ...shouldMarkReadParams,
            wasMarkedUnread: true,
          },
        });

        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });

        expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
        const channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.unread_messages).toBe(1);
      });

      it('should be performed when document is hidden and is scrolled to the bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce(
          (cb) => (channelUnreadUiStateCb = cb),
        );
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await render({
          channel,
          client,
          params: shouldMarkReadParams,
        });

        const docHiddenSpy = jest
          .spyOn(document, 'hidden', 'get')
          .mockReturnValueOnce(true);
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });

        expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
        const channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.unread_messages).toBe(1);
        docHiddenSpy.mockRestore();
      });
    });

    describe('update unread UI state last_read', () => {
      it('should be performed when message list is not scrolled to bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce(
          (cb) => (channelUnreadUiStateCb = cb),
        );
        const channelsData = [
          generateChannel({ messages: Array.from({ length: 2 }, generateMessage) }),
        ];
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData,
        });

        await render({
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

        const prevLastRead = 'X';
        let channelUnreadUiState = channelUnreadUiStateCb({ last_read: prevLastRead });
        expect(channelUnreadUiState.last_read).toBe(prevLastRead);
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 0 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[1].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[1].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 1 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(0);
      });

      it('should be performed when channel was marked unread and is scrolled to the bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementation((cb) => (channelUnreadUiStateCb = cb));
        const channelsData = [generateChannel({ messages: [generateMessage()] })];
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData,
        });

        await render({
          channel,
          client,
          params: {
            ...shouldMarkReadParams,
            wasMarkedUnread: true,
          },
        });

        await act(async () => {
          await dispatchMessageNewEvent(client, generateMessage(), channel);
        });

        const prevLastRead = 'X';
        let channelUnreadUiState = channelUnreadUiStateCb({ last_read: prevLastRead });
        expect(channelUnreadUiState.last_read).toBe(prevLastRead);
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 0 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[0].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[0].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 1 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(0);
      });

      it('should be performed when document is hidden and is scrolled to the bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementation((cb) => (channelUnreadUiStateCb = cb));
        const channelsData = [generateChannel({ messages: [generateMessage()] })];
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels({
          channelsData,
        });

        await render({
          channel,
          client,
          params: shouldMarkReadParams,
        });

        const docHiddenSpy = jest
          .spyOn(document, 'hidden', 'get')
          .mockReturnValueOnce(true);
        await act(async () => {
          await dispatchMessageNewEvent(client, generateMessage(), channel);
        });

        const prevLastRead = 'X';
        let channelUnreadUiState = channelUnreadUiStateCb({ last_read: prevLastRead });
        expect(channelUnreadUiState.last_read).toBe(prevLastRead);
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 0 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[0].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.last_read.getTime()).toBe(
          channelsData[0].messages[0].created_at.getTime(),
        );
        channelUnreadUiState = channelUnreadUiStateCb({ unread_messages: 1 });
        expect(channelUnreadUiState.last_read.getTime()).toBe(0);
        docHiddenSpy.mockRestore();
      });
    });
  });
});
