import { generateMessage } from '../../../mock-builders';
import { getIsFirstUnreadMessage } from '../utils';
import type { Channel } from 'stream-chat';

describe('getIsFirstUnreadMessage', () => {
  it('uses unread snapshot boundary and does not depend on live tracker state', () => {
    const message = generateMessage({ created_at: new Date('2026-03-06T10:05:00.000Z') });
    const channel = {
      getClient: () => ({ user: { id: 'current-user' } }),
    };

    const result = getIsFirstUnreadMessage({
      channel: channel as unknown as Channel,
      isFirstMessage: true,
      lastReadAt: new Date('2026-03-06T10:00:00.000Z'),
      message,
      unreadCount: 1,
    });

    expect(result).toBe(true);
  });

  it('does not render separator when snapshot unreadCount is 0', () => {
    const message = generateMessage({ created_at: new Date('2026-03-06T10:05:00.000Z') });
    const channel = {
      getClient: () => ({ user: { id: 'current-user' } }),
    };

    const result = getIsFirstUnreadMessage({
      channel: channel as unknown as Channel,
      isFirstMessage: true,
      lastReadAt: new Date('2026-03-06T10:00:00.000Z'),
      message,
      unreadCount: 0,
    });

    expect(result).toBe(false);
  });

  it('does not show separator for thread messages', () => {
    const message = generateMessage({ parent_id: 'parent-id' });
    const channel = {
      getClient: () => ({ user: { id: 'current-user' } }),
    };

    const result = getIsFirstUnreadMessage({
      channel: channel as unknown as Channel,
      isFirstMessage: true,
      message,
      unreadCount: 1,
    });

    expect(result).toBe(false);
  });
});
