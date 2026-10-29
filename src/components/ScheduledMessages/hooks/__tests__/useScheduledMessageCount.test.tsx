import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { useScheduledMessageCount } from '../useScheduledMessageCount';
import type { UseScheduledMessageCountParams } from '../../types';
import { ChatProvider } from '../../../../context';
import {
  generateScheduledMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';

const cid = 'messaging:general';
const otherCid = 'messaging:random';

const renderUseScheduledMessageCount = (
  client: StreamChat,
  params: UseScheduledMessageCountParams,
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
  );
  const renders = { count: 0 };

  const hook = renderHook(
    () => {
      renders.count += 1;
      return useScheduledMessageCount(params);
    },
    { wrapper },
  );

  return { ...hook, renders };
};

describe('useScheduledMessageCount', () => {
  it('counts the channel-level scheduled messages of a channel', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    [
      generateScheduledMessage({ cid }),
      generateScheduledMessage({ cid }),
      generateScheduledMessage({
        cid,
        message: { parent_id: 'parent-1', text: 'reply' },
      }),
      generateScheduledMessage({ cid: otherCid }),
    ].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessageCount(client, { cid });

    expect(result.current).toBe(2);
  });

  it('counts the scheduled replies of a thread', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    [
      generateScheduledMessage({ cid }),
      generateScheduledMessage({
        cid,
        message: { parent_id: 'parent-1', text: 'reply' },
      }),
    ].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessageCount(client, {
      cid,
      parentId: 'parent-1',
    });

    expect(result.current).toBe(1);
  });

  it('counts only the thread replies of the given channel', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    [
      generateScheduledMessage({
        cid,
        message: { parent_id: 'parent-1', text: 'reply' },
      }),
      generateScheduledMessage({
        cid: otherCid,
        message: { parent_id: 'parent-1', text: 'reply elsewhere' },
      }),
    ].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessageCount(client, {
      cid,
      parentId: 'parent-1',
    });

    expect(result.current).toBe(1);
  });

  it('updates when a scheduled message is added or removed', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const scheduledMessage = generateScheduledMessage({ cid });
    const { result } = renderUseScheduledMessageCount(client, { cid });

    act(() => {
      client.scheduledMessages.upsertToState(scheduledMessage);
    });
    expect(result.current).toBe(1);

    act(() => {
      client.scheduledMessages.removeFromState(scheduledMessage.id);
    });
    expect(result.current).toBe(0);
  });

  it('does not re-render when the count stays the same', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const scheduledMessage = generateScheduledMessage({ cid });
    client.scheduledMessages.upsertToState(scheduledMessage);
    const { renders } = renderUseScheduledMessageCount(client, { cid });
    const rendersBefore = renders.count;

    act(() => {
      client.scheduledMessages.upsertToState({
        ...scheduledMessage,
        message: { text: 'edited' },
      });
      client.scheduledMessages.upsertToState(generateScheduledMessage({ cid: otherCid }));
    });

    expect(renders.count).toBe(rendersBefore);
  });
});
