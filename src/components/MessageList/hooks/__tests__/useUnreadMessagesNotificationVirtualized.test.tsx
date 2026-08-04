import { renderHook } from '@testing-library/react';
import React from 'react';
import { useUnreadMessagesNotificationVirtualized } from '../VirtualizedMessageList';
import { act } from '@testing-library/react';
import { generateMessage, initClientWithChannels } from '../../../../mock-builders';
import type { RenderedMessage } from '../../utils';
import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';

// MERGE-RECONCILE (test migration): useUnreadMessagesNotificationVirtualized was rewritten to
// read `unreadCount`/`lastReadAt` from `channel.messagePaginator.unreadStateSnapshot` (via
// useStateStore) instead of receiving `unreadCount`/`lastRead` as params. The hook now only
// takes `{ showAlways }`. Tests set the unread state through
// `channel.messagePaginator.setUnreadSnapshot(...)` and render inside the real
// <Chat>/<Channel> providers so `useMessagePaginator` can resolve the channel.
//
// The snapshot has to be seeded AFTER the <Channel> bootstrap has settled: mounting <Channel>
// runs the paginator's first-page query, whose postQueryReconcile calls
// `MessagePaginator.seedUnreadSnapshot()` and (re)derives the snapshot from `channel.state.read`
// — which for a generated channel means `unreadCount: 0` and a fresh `last_read`. Seeding before
// the render would therefore be overwritten before the hook ever observed it.
const render = async ({
  lastRead = null,
  showAlways = false,
  unreadCount = 0,
}: {
  lastRead?: Date | null;
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
  // flush the <Channel> bootstrap (and its unread-snapshot re-seed) before seeding the snapshot
  // the test actually wants the hook to observe.
  await act(async () => {
    await Promise.resolve();
  });
  await act(() => {
    channel.messagePaginator.setUnreadSnapshot({ lastReadAt: lastRead, unreadCount });
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
          lastReadAt: new Date('1970-1-1'),
          unreadCount: 1,
        });
      });
      expect(result.current.show).toBe(false);
    });

    it('should not show notification if unread count is 0', async () => {
      const now = new Date();
      const lastRead = new Date(now.getTime() - 1000);
      const firstRenderedMsgCreated = new Date(now.getTime() - 500);
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
        const now = new Date();
        const lastRead = new Date(now.getTime() - 1000);
        const firstRenderedMsgCreated = new Date(now.getTime() - 500);
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
        const now = new Date();
        const firstRenderedMsgCreated = new Date(now.getTime() - 1002);
        const lastRenderedMsgCreated = new Date(now.getTime() - 1001);
        const lastRead = new Date(now.getTime() - 1000);
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
        const now = new Date();
        const firstRenderedMsgCreated = new Date(now.getTime() - 1002);
        const lastRead = new Date(now.getTime() - 1001);
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
        const now = new Date();
        const lastRead = new Date(now.getTime() - 1001);
        const lastRenderedMsgCreated = new Date(now.getTime() - 1000);
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
});
