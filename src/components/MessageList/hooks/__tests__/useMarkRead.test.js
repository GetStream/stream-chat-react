import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useMarkRead } from '../useMarkRead';
import { ChannelActionProvider, ChannelStateProvider, ChatProvider } from '../../../../context';
import {
  dispatchMessageNewEvent,
  generateChannel,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../../mock-builders';
import { act } from 'react-dom/test-utils';

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

describe('useMarkRead', () => {
  const shouldMarkReadParams = {
    isMessageListScrolledToBottom: true,
    markReadOnScrolledToBottom: true,
    messageListIsThread: false,
    unreadCount: 1,
    wasMarkedUnread: false,
  };

  beforeEach(jest.clearAllMocks);

  describe.each([[visibilityChangeScenario], ['render'], ['message.new']])('on %s', (scenario) => {
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
      } else if (scenario === 'message.new') {
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });
        expect(setChannelUnreadUiState).not.toHaveBeenCalled();
      }
      expect(markRead).not.toHaveBeenCalled();
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
      } else if (scenario === 'message.new') {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce((cb) => (channelUnreadUiStateCb = cb));
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });
        expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
        const channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.unread_messages).toBe(1);
      }
      expect(markRead).not.toHaveBeenCalled();
    });

    it('should not mark channel read from message list in channel with 0 unread messages', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      const countUnread = jest.spyOn(channel, 'countUnread').mockReturnValueOnce(0);

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
      });

      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (scenario === 'message.new') {
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });
        expect(setChannelUnreadUiState).not.toHaveBeenCalled();
      }

      expect(markRead).not.toHaveBeenCalled();
      countUnread.mockRestore();
    });

    it('should not mark channel read from non-thread message list scrolled to the bottom previously marked unread', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await render({
        channel,
        client,
        params: {
          shouldMarkReadParams,
          wasMarkedUnread: true,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (scenario === 'message.new') {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce((cb) => (channelUnreadUiStateCb = cb));
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });
        expect(setChannelUnreadUiState).toHaveBeenCalledTimes(1);
        const channelUnreadUiState = channelUnreadUiStateCb();
        expect(channelUnreadUiState.unread_messages).toBe(1);
      }

      expect(markRead).not.toHaveBeenCalled();
    });

    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await render({
        channel,
        client,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
        expect(markRead).toHaveBeenCalledTimes(2);
      } else if (scenario === 'message.new') {
        await act(() => {
          dispatchMessageNewEvent(client, generateMessage(), channel);
        });
        expect(markRead).toHaveBeenCalledTimes(2);
        expect(setChannelUnreadUiState).not.toHaveBeenCalled();
      } else {
        expect(markRead).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('on message.new', () => {
    it('should not mark channel read for messages incoming to other channels', async () => {
      const {
        channels: [activeChannel, otherChannel],
        client,
      } = await initClientWithChannels({ channelsData: [generateChannel(), generateChannel()] });

      await render({
        channel: activeChannel,
        client,
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), otherChannel);
      });

      expect(markRead).not.toHaveBeenCalled();
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
    });

    it('should not mark channel read for own messages', async () => {
      const user = generateUser();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        customUser: user,
      });

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage({ user }), channel);
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
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
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
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
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

    it('should mark channel read for not-own messages when scrolled to bottom in main message list', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await render({
        channel,
        client,
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
      });

      await act(() => {
        dispatchMessageNewEvent(client, generateMessage(), channel);
      });

      expect(markRead).toHaveBeenCalledTimes(1);
      expect(setChannelUnreadUiState).not.toHaveBeenCalled();
    });

    describe('update unread UI state unread_messages', () => {
      it('should be performed when message list is not scrolled to bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce((cb) => (channelUnreadUiStateCb = cb));
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
        setChannelUnreadUiState.mockImplementationOnce((cb) => (channelUnreadUiStateCb = cb));
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
    });

    describe('update unread UI state last_read', () => {
      it('should be performed when message list is not scrolled to bottom', async () => {
        let channelUnreadUiStateCb;
        setChannelUnreadUiState.mockImplementationOnce((cb) => (channelUnreadUiStateCb = cb));
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
    });
  });
});
