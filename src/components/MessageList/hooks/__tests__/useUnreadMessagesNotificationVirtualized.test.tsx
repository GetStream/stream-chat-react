import { renderHook } from '@testing-library/react';
import React from 'react';
import { useUnreadMessagesNotificationVirtualized } from '../VirtualizedMessageList';
import { act } from '@testing-library/react';
import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import type { RenderedMessage } from '../../utils';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { asTimestampNS, msToNs, nowNs } from 'stream-chat';
import { convertDateToTimestamp } from '../../../../mock-builders/generator/time';

// The hook reads `channel.messagePaginator.unreadStateSnapshot`, so tests seed it with
// `setUnreadSnapshot` and render inside the real <Chat>/<Channel> so `useMessagePaginator` resolves
// the channel. The snapshot is seeded after the <Channel> bootstrap settles: its first-page query
// re-derives the snapshot from `channel.state.read` (`unreadCount: 0` for a generated channel),
// which would overwrite an earlier seed.
const render = async ({
  lastRead = null,
  showAlways = false,
  unreadCount = 0,
}: {
  lastRead?: number | null;
  showAlways?: boolean;
  unreadCount?: number;
} = {}) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels();
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <Chat client={client}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );
  const utils = renderHook(
    () => useUnreadMessagesNotificationVirtualized({ showAlways }),
    { wrapper },
  );
  // Flush the <Channel> bootstrap and its unread-snapshot re-seed before seeding the test's
  // snapshot.
  await act(async () => {
    await Promise.resolve();
  });
  await act(() => {
    channel.messagePaginator.setUnreadSnapshot({
      lastReadAt: lastRead == null ? null : asTimestampNS(lastRead),
      unreadCount,
    });
  });
  return { channel, ...utils };
};

describe('useUnreadMessagesNotificationVirtualized', () => {
  it('should hide the notification on mount if there are no unread messages', async () => {
    const { result } = await render({ unreadCount: 0 });
    expect(result.current.show).toBe(false);
  });

  describe('toggle function', () => {
    it('should prevent show state change when there are no messages to render', async () => {
      const { channel, result } = await render({ unreadCount: 0 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification([]);
      });
      await act(() => {
        channel.messagePaginator.setUnreadSnapshot({
          lastReadAt: convertDateToTimestamp('1970-01-01'),
          unreadCount: 1,
        });
      });
      expect(result.current.show).toBe(false);
    });

    it('should not show notification if unread count is 0', async () => {
      const now = nowNs();
      const lastRead = now - msToNs(1000);
      const firstRenderedMsgCreated = now - msToNs(500);
      const messages = [
        generateMessage({ created_at: firstRenderedMsgCreated }),
        generateMessage({ created_at: now }),
      ];
      const { result } = await render({ lastRead, showAlways: false, unreadCount: 0 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification(
          messages as RenderedMessage[],
        );
      });
      expect(result.current.show).toBe(false);
    });

    it.each([[true], [false]])(
      'should show notification if there are unread messages and first rendered message was created later than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = nowNs();
        const lastRead = now - msToNs(1000);
        const firstRenderedMsgCreated = now - msToNs(500);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: now }),
        ];
        const { result } = await render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(
            messages as RenderedMessage[],
          );
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
        const now = nowNs();
        const firstRenderedMsgCreated = now - msToNs(1002);
        const lastRenderedMsgCreated = now - msToNs(1001);
        const lastRead = now - msToNs(1000);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: lastRenderedMsgCreated }),
        ];
        const { result } = await render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(
            messages as RenderedMessage[],
          );
        });
        expect(result.current.show).toBe(showUnreadNotificationAlways);
      },
    );

    it.each([[true], [false]])(
      'should not show notification if the first rendered message was created earlier than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = nowNs();
        const firstRenderedMsgCreated = now - msToNs(1002);
        const lastRead = now - msToNs(1001);
        const messages = [
          generateMessage({ created_at: firstRenderedMsgCreated }),
          generateMessage({ created_at: lastRead }),
        ];
        const { result } = await render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(
            messages as RenderedMessage[],
          );
        });
        expect(result.current.show).toBe(false);
      },
    );

    it.each([[true], [false]])(
      'should not show notification if the last rendered message was created earlier than last read when showUnreadNotificationAlways is %s',
      async (showUnreadNotificationAlways) => {
        const now = nowNs();
        const lastRead = now - msToNs(1001);
        const lastRenderedMsgCreated = now - msToNs(1000);
        const messages = [
          generateMessage({ created_at: lastRead }),
          generateMessage({ created_at: lastRenderedMsgCreated }),
        ];
        const { result } = await render({
          lastRead,
          showAlways: showUnreadNotificationAlways,
          unreadCount: 1,
        });
        await act(() => {
          result.current.toggleShowUnreadMessagesNotification(
            messages as RenderedMessage[],
          );
        });
        expect(result.current.show).toBe(false);
      },
    );
  });

  // Newer messages can be loaded past the rendered range, so the loaded window cannot tell which way
  // the unread messages are.
  describe('unreadIsBelow', () => {
    it('is true when every rendered message is older than the last read one', async () => {
      const now = nowNs();
      const lastRead = now - msToNs(1000);
      const messages = [
        generateMessage({ created_at: now - msToNs(1002) }),
        generateMessage({ created_at: now - msToNs(1001) }),
      ];
      const { result } = await render({ lastRead, showAlways: true, unreadCount: 1 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification(
          messages as RenderedMessage[],
        );
      });
      expect(result.current.unreadIsBelow).toBe(true);
    });

    it('is false when every rendered message is newer than the last read one', async () => {
      const now = nowNs();
      const lastRead = now - msToNs(1000);
      const messages = [
        generateMessage({ created_at: now - msToNs(500) }),
        generateMessage({ created_at: now }),
      ];
      const { result } = await render({ lastRead, unreadCount: 1 });
      await act(() => {
        result.current.toggleShowUnreadMessagesNotification(
          messages as RenderedMessage[],
        );
      });
      expect(result.current.unreadIsBelow).toBe(false);
    });
  });
});
