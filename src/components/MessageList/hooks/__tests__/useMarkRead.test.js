import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useMarkRead } from '../useMarkRead';
import { ChannelActionProvider } from '../../../../context';

const visibilityChangeScenario = 'visibilitychange event';
const markRead = jest.fn();

const render = ({ params }) => {
  const wrapper = ({ children }) => (
    <ChannelActionProvider value={{ markRead }}>{children}</ChannelActionProvider>
  );
  const { result } = renderHook(() => useMarkRead(params), { wrapper });
  return result.current;
};

describe('useMarkRead', () => {
  const shouldMarkReadParams = {
    isMessageListScrolledToBottom: true,
    messageListIsThread: false,
    unreadCount: 1,
    wasChannelMarkedUnread: false,
  };

  beforeEach(jest.clearAllMocks);

  describe.each([[visibilityChangeScenario], ['render']])('on %s', (scenario) => {
    it('should not mark channel read from thread message list', () => {
      render({
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
      render({
        params: {
          ...shouldMarkReadParams,
          unreadCount: 0,
        },
      });
      if (scenario === visibilityChangeScenario) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      expect(markRead).toHaveBeenCalledTimes(0);
    });

    it('should mark channel read from non-thread message list scrolled to the bottom not previously marked unread', () => {
      render({
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
