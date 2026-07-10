import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Shared spies + mutable per-test state. `vi.hoisted` runs before the `vi.mock` factories below, so
// they can close over these.
const mocks = vi.hoisted(() => ({
  ingestChannel: vi.fn(),
  jumpToMessage: vi.fn(() => Promise.resolve(true)),
  open: vi.fn(),
  // `query` should never be called by the hook (the jump bootstraps the channel) — asserted below.
  query: vi.fn(() => Promise.resolve()),
  state: {
    channelSlot: undefined as string | undefined,
    message: { id: 'reply-1', parent_id: 'parent-1', show_in_channel: true } as
      | { id: string; parent_id?: string; show_in_channel?: boolean }
      | undefined,
    thread: undefined as unknown,
  },
}));

vi.mock('../../../../context', () => ({
  useChannel: () => ({
    cid: 'messaging:general',
    initialized: false,
    messagePaginator: { jumpToMessage: mocks.jumpToMessage },
    query: mocks.query,
  }),
  useChatContext: () => ({
    channelPaginatorsOrchestrator: { ingestChannel: mocks.ingestChannel },
    client: {
      getThread: vi.fn(),
      notifications: { addError: vi.fn() },
      threads: { threadsById: {} },
    },
  }),
  useMessageContext: () => ({ message: mocks.state.message }),
  useTranslationContext: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../ChatView', () => ({
  useChatViewNavigation: () => ({ open: mocks.open }),
  useSlotForKey: () => mocks.state.channelSlot,
}));

vi.mock('../../../Threads', () => ({ useThreadContext: () => mocks.state.thread }));

import { useMessageAlsoSentInChannelNavigation } from '../useMessageAlsoSentInChannelNavigation';

const renderNavigation = () =>
  renderHook(() => useMessageAlsoSentInChannelNavigation()).result;

describe('useMessageAlsoSentInChannelNavigation', () => {
  beforeEach(() => {
    mocks.state.channelSlot = undefined;
    mocks.state.thread = undefined;
    mocks.state.message = { id: 'reply-1', parent_id: 'parent-1', show_in_channel: true };
    vi.clearAllMocks();
  });

  it('derives isInThread / isShownInChannel from context', () => {
    mocks.state.thread = { id: 'parent-1' };
    const result = renderNavigation();
    expect(result.current.isInThread).toBe(true);
    expect(result.current.isShownInChannel).toBe(true);

    mocks.state.thread = undefined;
    mocks.state.message = { id: 'reply-1', show_in_channel: false };
    const next = renderNavigation();
    expect(next.current.isInThread).toBe(false);
    expect(next.current.isShownInChannel).toBe(false);
  });

  describe('viewReplyInChannel', () => {
    it('when the channel is not shown: opens it, jumps, then ingests — with no separate init query', async () => {
      mocks.state.channelSlot = undefined; // channel absent from the active view → navigate

      const result = renderNavigation();
      await result.current.viewReplyInChannel('reply-1');

      expect(mocks.open).toHaveBeenCalledTimes(1);
      expect(mocks.open).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'messaging:general', kind: 'channel' }),
      );
      expect(mocks.jumpToMessage).toHaveBeenCalledWith('reply-1');
      expect(mocks.ingestChannel).toHaveBeenCalledTimes(1);
      // The jump's own `channel.query({ messages: { id_around } })` bootstraps the channel, so we
      // must NOT fire a separate init query.
      expect(mocks.query).not.toHaveBeenCalled();

      // Order: open → jumpToMessage → ingestChannel (ingest after the jump so channel.data is loaded).
      const openOrder = mocks.open.mock.invocationCallOrder[0];
      const jumpOrder = mocks.jumpToMessage.mock.invocationCallOrder[0];
      const ingestOrder = mocks.ingestChannel.mock.invocationCallOrder[0];
      expect(openOrder).toBeLessThan(jumpOrder);
      expect(ingestOrder).toBeGreaterThan(jumpOrder);
    });

    it('when the channel is already shown: only jumps (no navigate/ingest/query)', async () => {
      mocks.state.channelSlot = 'main-channel'; // channel already bound in the active view

      const result = renderNavigation();
      await result.current.viewReplyInChannel('reply-1');

      expect(mocks.jumpToMessage).toHaveBeenCalledWith('reply-1');
      expect(mocks.open).not.toHaveBeenCalled();
      expect(mocks.ingestChannel).not.toHaveBeenCalled();
      expect(mocks.query).not.toHaveBeenCalled();
    });

    it('defaults the target to the current message id', async () => {
      mocks.state.channelSlot = 'main-channel';
      const result = renderNavigation();
      await result.current.viewReplyInChannel();
      expect(mocks.jumpToMessage).toHaveBeenCalledWith('reply-1');
    });
  });
});
