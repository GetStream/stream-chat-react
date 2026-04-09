import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { useReactionsFetcher } from '../useReactionsFetcher';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';
import type { LocalMessage, MessageResponse } from 'stream-chat';

describe('useReactionsFetcher', () => {
  it('paginates until next is empty', async () => {
    const client = await getTestClientWithUser({ id: 'u1' });
    const queryReactions = vi
      .spyOn(client, 'queryReactions')
      .mockResolvedValueOnce({
        duration: '0',
        next: 'page-2',
        reactions: [{ created_at: new Date(), type: 'like', updated_at: new Date() }],
      } as never)
      .mockResolvedValueOnce({
        duration: '0',
        reactions: [{ created_at: new Date(), type: 'love', updated_at: new Date() }],
      } as never);

    const message = generateMessage() as MessageResponse & LocalMessage;

    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useReactionsFetcher(message), { wrapper });

    let reactions: unknown[];
    await act(async () => {
      reactions = await result.current();
    });

    expect(queryReactions).toHaveBeenCalledTimes(2);
    expect(queryReactions.mock.calls[0]?.[3]).toEqual(
      expect.objectContaining({ limit: 25, next: undefined }),
    );
    expect(queryReactions.mock.calls[1]?.[3]).toEqual(
      expect.objectContaining({ limit: 25, next: 'page-2' }),
    );
    expect(reactions!).toHaveLength(2);
  });
});
