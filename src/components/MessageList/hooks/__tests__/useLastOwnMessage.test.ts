import { renderHook } from '@testing-library/react';

import { generateMessage, generateUser } from '../../../../mock-builders';
import { useLastOwnMessage } from '../useLastOwnMessage';

describe('useLastOwnMessage', () => {
  it('returns undefined when there are no messages', () => {
    const ownUser = generateUser();

    const { result } = renderHook(() =>
      useLastOwnMessage({ messages: undefined, ownUserId: ownUser.id }),
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when there are no own messages', () => {
    const ownUser = generateUser();
    const otherUser = generateUser();
    const messages = [generateMessage({ user: otherUser })];

    const { result } = renderHook(() =>
      useLastOwnMessage({ messages, ownUserId: ownUser.id }),
    );

    expect(result.current).toBeUndefined();
  });

  it('returns the first message when it is the only own message', () => {
    const ownUser = generateUser();
    const otherUser = generateUser();
    const ownMessage = generateMessage({ user: ownUser });
    const messages = [ownMessage, generateMessage({ user: otherUser })];

    const { result } = renderHook(() =>
      useLastOwnMessage({ messages, ownUserId: ownUser.id }),
    );

    expect(result.current).toBe(ownMessage);
  });

  it('returns the latest own message', () => {
    const ownUser = generateUser();
    const otherUser = generateUser();
    const firstOwnMessage = generateMessage({ user: ownUser });
    const lastOwnMessage = generateMessage({ user: ownUser });
    const messages = [
      firstOwnMessage,
      generateMessage({ user: otherUser }),
      lastOwnMessage,
      generateMessage({ user: otherUser }),
    ];

    const { result } = renderHook(() =>
      useLastOwnMessage({ messages, ownUserId: ownUser.id }),
    );

    expect(result.current).toBe(lastOwnMessage);
  });
});
