import { renderHook } from '@testing-library/react';
import { StateStore } from '@stream-io/state-store';
import type { Channel, LocalMessage, UserResponse } from 'stream-chat';

import { useReceiptsByMessageId } from '../useReceiptsByMessageId';

const user = (id: string): UserResponse => ({ id }) as UserResponse;

const message = (id: string, createdAt: number) =>
  ({ created_at: createdAt, id }) as LocalMessage;

// m1 … m4, oldest first, as the list renders them.
const messages = [
  message('m1', 1000),
  message('m2', 2000),
  message('m3', 3000),
  message('m4', 4000),
];

/**
 * Cursors: bob stopped on m1, alice on m3. Nobody is past m4, so its answer is empty and each
 * older message adds whoever stopped there.
 */
const setup = ({
  deliveredByMessageId = {},
  readersByMessageId = {},
}: {
  deliveredByMessageId?: Record<string, UserResponse[]>;
  readersByMessageId?: Record<string, UserResponse[]>;
} = {}) => {
  const snapshotStore = new StateStore({
    deliveredByMessageId,
    lastDeliveredRefByOthers: null,
    lastReadRefByOthers: null,
    readersByMessageId,
    revision: 1,
  });

  const cursorsAtOrPast =
    (buckets: Record<string, UserResponse[]>) => (ref: { timestamp: number }) => {
      const seen = new Map<string, UserResponse>();
      for (const m of messages) {
        if (m.created_at < ref.timestamp) continue;
        for (const u of buckets[m.id] ?? []) seen.set(u.id, u);
      }
      return Array.from(seen.values());
    };

  const channel = {
    messageReceiptsTracker: {
      deliveredForMessage: cursorsAtOrPast(deliveredByMessageId),
      readersForMessage: cursorsAtOrPast(readersByMessageId),
      snapshotStore,
    },
  } as unknown as Channel;

  return { channel };
};

describe('useReceiptsByMessageId', () => {
  it('names everyone at or past a message, not just whoever stopped on it', () => {
    const { channel } = setup({
      readersByMessageId: { m1: [user('bob')], m3: [user('alice')] },
    });

    const { result } = renderHook(() =>
      useReceiptsByMessageId({
        channel,
        kind: 'read',
        messages,
        returnAllReadData: true,
      }),
    );

    // alice stopped on m3, so she has read m1 and m2 as well — the whole point.
    expect(result.current.m1.map((u) => u.id).sort()).toEqual(['alice', 'bob']);
    expect(result.current.m2.map((u) => u.id)).toEqual(['alice']);
    expect(result.current.m3.map((u) => u.id)).toEqual(['alice']);
    expect(result.current.m4).toEqual([]);
  });

  it('never reports fewer readers for an older message than for a newer one', () => {
    const { channel } = setup({
      readersByMessageId: { m1: [user('bob')], m3: [user('alice')] },
    });

    const { result } = renderHook(() =>
      useReceiptsByMessageId({
        channel,
        kind: 'read',
        messages,
        returnAllReadData: true,
      }),
    );

    const counts = messages.map((m) => result.current[m.id].length);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('shares one array across the run of messages with no cursor on them', () => {
    const { channel } = setup({
      readersByMessageId: { m1: [user('bob')], m3: [user('alice')] },
    });

    const { result } = renderHook(() =>
      useReceiptsByMessageId({
        channel,
        kind: 'read',
        messages,
        returnAllReadData: true,
      }),
    );

    // m2 adds nobody, so it reuses m3's array rather than allocating an equal one.
    expect(result.current.m2).toBe(result.current.m3);
    expect(result.current.m1).not.toBe(result.current.m2);
  });

  it('reads the delivery buckets when asked for delivery', () => {
    const { channel } = setup({
      deliveredByMessageId: { m3: [user('carol')] },
      readersByMessageId: { m1: [user('bob')] },
    });

    const { result } = renderHook(() =>
      useReceiptsByMessageId({
        channel,
        kind: 'delivered',
        messages,
        returnAllReadData: true,
      }),
    );

    expect(result.current.m1.map((u) => u.id)).toEqual(['carol']);
  });

  it('covers only the last own message unless all read data is requested', () => {
    const { channel } = setup({
      readersByMessageId: { m1: [user('bob')], m3: [user('alice')] },
    });

    const { result } = renderHook(() =>
      useReceiptsByMessageId({
        channel,
        kind: 'read',
        lastOwnMessage: messages[0],
        messages,
        returnAllReadData: false,
      }),
    );

    expect(Object.keys(result.current)).toEqual(['m1']);
    expect(result.current.m1.map((u) => u.id).sort()).toEqual(['alice', 'bob']);
  });
});
