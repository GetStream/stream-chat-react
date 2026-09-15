import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';
import { describe, expect, it } from 'vitest';

import type { PropsWithChildren } from 'react';
import type { LocalMessage, Thread as StreamThread, ThreadState } from 'stream-chat';

import { ThreadProvider } from '../../../Threads';
import { useCanPaginateReplies } from '../useCanPaginateReplies';
import { generateMessage } from '../../../../mock-builders';

const makeThread = ({
  items,
  replyCount,
}: {
  items?: LocalMessage[];
  replyCount: number;
}) =>
  fromPartial<StreamThread>({
    messagePaginator: {
      state: new StateStore<{ items: LocalMessage[] | undefined }>({ items }),
    },
    state: new StateStore<ThreadState>(fromPartial<ThreadState>({ replyCount })),
  });

const renderWithThread = (thread?: StreamThread) =>
  renderHook(() => useCanPaginateReplies(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <ThreadProvider thread={thread}>{children}</ThreadProvider>
    ),
  });

describe('useCanPaginateReplies', () => {
  it('allows pagination outside a thread', () => {
    const { result } = renderWithThread(undefined);

    expect(result.current).toBe(true);
  });

  it('refuses on a thread with no replies', () => {
    // Nothing to fetch, and until the first reply the thread does not exist server-side.
    const { result } = renderWithThread(makeThread({ items: undefined, replyCount: 0 }));

    expect(result.current).toBe(false);
  });

  it('refuses when the list already holds every reply', () => {
    // The state right after the first reply is sent: it is ingested locally and the parent's count
    // has caught up, so arming the scroller would fetch a page that is already in hand.
    const { result } = renderWithThread(
      makeThread({ items: [generateMessage() as LocalMessage], replyCount: 1 }),
    );

    expect(result.current).toBe(false);
  });

  it('allows pagination when the parent reports replies the list does not hold', () => {
    const { result } = renderWithThread(
      makeThread({ items: [generateMessage() as LocalMessage], replyCount: 5 }),
    );

    expect(result.current).toBe(true);
  });

  it('refuses while nothing is loaded, even on a thread that has replies', () => {
    // The first page belongs to `Thread.reload()` (`GET /threads/:id`, which also hydrates and
    // watches). Arming here would fetch the same page again as `GET /messages/:id/replies`.
    const { result } = renderWithThread(makeThread({ items: undefined, replyCount: 2 }));

    expect(result.current).toBe(false);
  });

  it('refuses on a reopened thread whose paginator was disposed', () => {
    // `unregisterSubscriptions` leaves `items` as `[]` rather than `undefined`; the stale reload
    // provides the first page, so the scroller still must not race it.
    const { result } = renderWithThread(makeThread({ items: [], replyCount: 2 }));

    expect(result.current).toBe(false);
  });

  it('arms once a page is loaded and the parent reports more', () => {
    const thread = makeThread({ items: undefined, replyCount: 120 });
    const { rerender, result } = renderWithThread(thread);
    expect(result.current).toBe(false);

    thread.messagePaginator.state.partialNext({
      items: Array.from({ length: 50 }, () => generateMessage() as LocalMessage),
    });
    rerender();

    expect(result.current).toBe(true);
  });
});
