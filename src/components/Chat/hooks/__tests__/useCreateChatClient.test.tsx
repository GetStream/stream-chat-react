import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCreateChatClient } from '../useCreateChatClient';

// `connectUser` and `disconnectUser` are instance properties, so they cannot be spied on through the
// prototype; the real client is subclassed to keep the network out of the test.
vi.mock('stream-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('stream-chat')>();
  class OfflineStreamChat extends actual.StreamChat {
    connectUser = vi.fn().mockResolvedValue(undefined);
    disconnectUser = vi.fn().mockResolvedValue(undefined);
  }
  return { ...actual, StreamChat: OfflineStreamChat };
});

describe('useCreateChatClient', () => {
  it('constructs the client from the configuration tree it is given', async () => {
    const { result } = renderHook(() =>
      useCreateChatClient({
        apiKey: 'key',
        config: { client: { baseURL: 'http://example.com:3030' } },
        tokenOrProvider: 'token',
        userData: { id: 'user' },
      }),
    );

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.baseURL).toBe('http://example.com:3030');
  });
});
