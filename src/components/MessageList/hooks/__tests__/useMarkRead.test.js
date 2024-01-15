import { ChannelActionProvider, ChannelStateProvider } from '../../../../context';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { useMarkRead } from '../useMarkRead';
import { initClientWithChannel } from '../../../../mock-builders';

const visibilityChangeScenario = 'visibilitychange event';
const markRead = jest.fn().mockReturnValue();
let channel;
let channelCountUnreadSpy;

const render = ({ channel, params }) => {
  const wrapper = ({ children }) => (
    <ChannelStateProvider value={{ channel }}>
      <ChannelActionProvider value={{ markRead }}>{children}</ChannelActionProvider>
    </ChannelStateProvider>
  );
  const { result } = renderHook(() => useMarkRead(params), { wrapper });
  return result.current;
};

describe('useMarkRead', () => {
  const shouldMarkReadParams = {
    isMessageListScrolledToBottom: true,
    messageListIsThread: false,
    wasChannelMarkedUnread: false,
  };
  beforeAll(async () => {
    channel = (await initClientWithChannel()).channel;
    channelCountUnreadSpy = jest.spyOn(channel, 'countUnread').mockReturnValue(1);
  });

  beforeEach(jest.clearAllMocks);

  describe.each([[visibilityChangeScenario], ['render']])('on %s', (scenario) => {
    it('should not mark channel read from thread message list', () => {
      render({
        channel,
        params: {
          ...shouldMarkReadParams,
          messageListIsThread: true,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark channel read from message list not scrolled to the bottom', () => {
      render({
        channel,
        params: {
          ...shouldMarkReadParams,
          isMessageListScrolledToBottom: false,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark channel read from message list in channel previously marked unread', () => {
      render({
        channel,
        params: {
          ...shouldMarkReadParams,
          wasChannelMarkedUnread: true,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should not mark channel read from message list in channel with 0 unread messages', () => {
      channelCountUnreadSpy.mockReturnValueOnce(0);
      render({
        channel,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread', () => {
      render({
        channel,
        params: shouldMarkReadParams,
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
        expect(markRead).toHaveBeenCalledTimes(2);
      } else {
        expect(markRead).toHaveBeenCalledTimes(1);
      }
    });
  });
});
