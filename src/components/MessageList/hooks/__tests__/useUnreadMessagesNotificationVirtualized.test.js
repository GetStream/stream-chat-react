import { renderHook } from '@testing-library/react';
import React from 'react';
import { useUnreadMessagesNotificationVirtualized } from '../VirtualizedMessageList';
import { act } from '@testing-library/react';
import { generateMessage } from '../../../../mock-builders';

const render = (params) => {
  const wrapper = ({ children }) => <>{children}</>;
  return renderHook(() => useUnreadMessagesNotificationVirtualized(params), {
    wrapper,
  });
};
describe('useUnreadMessagesNotificationVirtualized', () => {
  it('should hide the notification on mount if there are no unread messages', () => {
    const {
      result: {
        current: { show },
      },
    } = render({ unreadCount: 0 });
    expect(show).toBe(false);
  });

  describe('toggle function', () => {
    it('should prevent show state change when there are no messages to render', async () => {
      const { rerender, result } = render({ unreadCount: 0 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification([]);
      });
      rerender({ lastRead: new Date('1970-1-1'), unreadCount: 1 });
      expect(result.current.show).toBe(false);
    });

    it('should not show notification if unread count is 0', async () => {
      const now = new Date();
      const lastRead = new Date(now - 1000);
      const firstRenderedMsgCreated = new Date(now - 500);
      const messages = [
        generateMessage({ created_at: firstRenderedMsgCreated }),
        generateMessage({ created_at: now }),
      ];
      const { result } = render({ lastRead, showAlways: false, unreadCount: 0 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification(messages);
      });
      expect(result.current.show).toBe(false);
    });

    it.each([[true], [false]])(
      'should show notification if there are unread messages and first rendered message was created later than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = new Date();
        const lastRead = new Date(now - 1000);
        const firstRenderedMsgCreated = new Date(now - 500);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: now }),
        ];
        const { result } = render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(messages);
        });
        expect(result.current.show).toBe(true);
      },
    );

    it.each([
      ['should', true],
      ['should not', false],
    ])(
      '%s show notification if the last rendered message was created earlier than last read when showUnreadNotificationAlways is %s',
      async (_, showUnreadNotificationAlways) => {
        const now = new Date();
        const firstRenderedMsgCreated = new Date(now - 1002);
        const lastRenderedMsgCreated = new Date(now - 1001);
        const lastRead = new Date(now - 1000);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: lastRenderedMsgCreated }),
        ];
        const { result } = render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(messages);
        });
        expect(result.current.show).toBe(showUnreadNotificationAlways);
      },
    );

    it.each([[true], [false]])(
      'should not show notification if the first rendered message was created earlier than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = new Date();
        const firstRenderedMsgCreated = new Date(now - 1002);
        const lastRead = new Date(now - 1001);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: lastRead }),
        ];
        const { result } = render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(messages);
        });
        expect(result.current.show).toBe(false);
      },
    );

    it.each([[true], [false]])(
      'should not show notification if the last rendered message was created earlier than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = new Date();
        const lastRead = new Date(now - 1001);
        const lastRenderedMsgCreated = new Date(now - 1000);
        const messages = [
          generateMessage({ created_at: lastRead }),
          generateMessage({ created_at: lastRenderedMsgCreated }),
        ];
        const { result } = render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(messages);
        });
        expect(result.current.show).toBe(false);
      },
    );
  });
});
