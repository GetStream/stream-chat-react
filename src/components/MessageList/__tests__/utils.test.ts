import { generateMessage } from '../../../mock-builders';
import { getIsFirstUnreadMessage } from '../utils';
import type { Channel } from 'stream-chat';

describe('getIsFirstUnreadMessage', () => {
  it('uses tracker-driven unread state via channel.messageReceiptsTracker', () => {
    const message = generateMessage();
    const hasUserRead = jest.fn().mockReturnValue(false);
    const channel = {
      getClient: () => ({ user: { id: 'current-user' } }),
      messageReceiptsTracker: { hasUserRead },
    };

    const result = getIsFirstUnreadMessage({
      channel: channel as unknown as Channel,
      isFirstMessage: true,
      message,
      unreadMessageCount: 1,
    });

    expect(result).toBe(true);
    expect(hasUserRead).toHaveBeenCalledTimes(1);
  });

  it('does not show separator for thread messages even with tracker-backed check', () => {
    const message = generateMessage({ parent_id: 'parent-id' });
    const hasUserRead = jest.fn().mockReturnValue(false);
    const channel = {
      getClient: () => ({ user: { id: 'current-user' } }),
      messageReceiptsTracker: { hasUserRead },
    };

    const result = getIsFirstUnreadMessage({
      channel: channel as unknown as Channel,
      isFirstMessage: true,
      message,
      unreadMessageCount: 1,
    });

    expect(result).toBe(false);
    expect(hasUserRead).not.toHaveBeenCalled();
  });
});
