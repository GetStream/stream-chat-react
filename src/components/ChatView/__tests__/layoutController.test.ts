import { createLayoutController } from '../layoutController/LayoutController';
import {
  restoreLayoutControllerState,
  serializeLayoutControllerState,
} from '../layoutController/serialization';
import { resolveTargetSlotChannelDefault } from '../layoutSlotResolvers';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatViewLayoutState } from '../layoutController/layoutControllerTypes';

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeThread = (id: string) => ({ id }) as unknown as StreamThread;
const makeBinding = (kind: string, source: unknown, key?: string) => ({
  key,
  payload: { key, kind, source },
});

describe('layoutController', () => {
  it('returns opened, replaced, and rejected outcomes from open()', () => {
    const controller = createLayoutController({
      initialState: {
        visibleSlots: ['slot1'],
      },
      resolveTargetSlot: () => 'slot1',
    });

    const firstOpen = controller.open(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
    );
    const secondOpen = controller.open(
      makeBinding('channel', makeChannel('messaging:two'), 'messaging:two'),
    );
    controller.clear('slot1');
    const rejectedOpen = controller.open(
      makeBinding('channel', makeChannel('messaging:three'), 'messaging:three'),
    );

    expect(firstOpen).toMatchObject({ slot: 'slot1', status: 'opened' });
    expect(secondOpen).toMatchObject({ slot: 'slot1', status: 'replaced' });
    expect(rejectedOpen).toMatchObject({
      reason: 'no-available-slot',
      status: 'rejected',
    });
  });

  it('tracks occupiedAt when slot becomes occupied and clears it on clear()', () => {
    const controller = createLayoutController({
      initialState: {
        visibleSlots: ['slot1'],
      },
    });

    controller.open(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
    );
    const occupiedAt = controller.state.getLatestValue().slotMeta.slot1?.occupiedAt;
    controller.clear('slot1');

    expect(typeof occupiedAt).toBe('number');
    expect(controller.state.getLatestValue().slotMeta.slot1).toBeUndefined();
  });

  it('supports duplicateEntityPolicy reject and move', () => {
    const rejectController = createLayoutController({
      duplicateEntityPolicy: 'reject',
      initialState: { visibleSlots: ['slot1', 'slot2'] },
      resolveTargetSlot: () => 'slot2',
    });
    const duplicateChannel = makeChannel('messaging:duplicate');

    rejectController.open(
      makeBinding('channel', duplicateChannel, duplicateChannel.cid),
      {
        targetSlot: 'slot1',
      },
    );
    const rejectResult = rejectController.open(
      makeBinding('channel', duplicateChannel, duplicateChannel.cid),
      {
        targetSlot: 'slot2',
      },
    );

    expect(rejectResult).toMatchObject({
      reason: 'duplicate-binding',
      status: 'rejected',
    });

    const moveController = createLayoutController({
      duplicateEntityPolicy: 'move',
      initialState: { visibleSlots: ['slot1', 'slot2'] },
    });

    moveController.open(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
      {
        targetSlot: 'slot1',
      },
    );
    moveController.open(
      makeBinding('channel', makeChannel('messaging:two'), 'messaging:two'),
      {
        targetSlot: 'slot2',
      },
    );
    moveController.open(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
      {
        targetSlot: 'slot2',
      },
    );

    const movedState = moveController.state.getLatestValue();
    expect(movedState.slotBindings.slot1).toBeUndefined();
    expect((movedState.slotBindings.slot2?.payload as { kind: string }).kind).toBe(
      'channel',
    );
    expect(
      (
        (movedState.slotBindings.slot2?.payload as { source: StreamChannel })
          .source as StreamChannel
      ).cid,
    ).toBe('messaging:one');
  });

  it('openView updates activeView and can activate target slot', () => {
    const controller = createLayoutController({
      initialState: {
        activeSlot: 'slot1',
        activeView: 'channels',
        visibleSlots: ['slot1', 'slot2'],
      },
    });

    controller.openView('threads');
    expect(controller.state.getLatestValue()).toMatchObject({
      activeSlot: 'slot1',
      activeView: 'threads',
    });

    controller.openView('channels', { slot: 'slot2' });
    expect(controller.state.getLatestValue()).toMatchObject({
      activeSlot: 'slot2',
      activeView: 'channels',
    });
  });

  it('serializes and restores hidden slots and serializable bindings', () => {
    const sourceController = createLayoutController({
      initialState: {
        hiddenSlots: { slot1: true },
        mode: 'test-mode',
        slotBindings: {
          slot1: makeBinding('channelList', { view: 'threads' }, 'channel-list'),
          slot2: makeBinding('channel', makeChannel('messaging:one'), 'channel-1'),
        },
        slotHistory: {
          slot2: [
            makeBinding('searchResults', { query: 'abc' }, 'search:abc'),
            makeBinding('channel', makeChannel('messaging:fallback'), 'channel-fallback'),
          ],
        },
        visibleSlots: ['slot1', 'slot2'],
      },
    });

    const snapshot = serializeLayoutControllerState(sourceController);
    expect((snapshot.slotBindings.slot1?.payload as { kind: string }).kind).toBe(
      'channelList',
    );
    expect((snapshot.slotBindings.slot2?.payload as { kind: string }).kind).toBe(
      'channel',
    );
    expect(
      snapshot.slotHistory.slot2?.map(
        (entry) => (entry.payload as { kind: string }).kind,
      ),
    ).toEqual(['searchResults', 'channel']);

    const restoreController = createLayoutController({
      initialState: { visibleSlots: ['slot1', 'slot2'] },
    });
    restoreLayoutControllerState(restoreController, snapshot);

    expect(restoreController.state.getLatestValue()).toMatchObject({
      hiddenSlots: { slot1: true },
      mode: 'test-mode',
      slotBindings: {
        slot1: makeBinding('channelList', { view: 'threads' }, 'channel-list'),
        slot2: makeBinding('channel', makeChannel('messaging:one'), 'channel-1'),
      },
      slotHistory: {
        slot2: [
          makeBinding('searchResults', { query: 'abc' }, 'search:abc'),
          makeBinding('channel', makeChannel('messaging:fallback'), 'channel-fallback'),
        ],
      },
    });
  });
});

describe('resolveTargetSlotChannelDefault', () => {
  const makeState = (overrides: Partial<ChatViewLayoutState>): ChatViewLayoutState => ({
    activeSlot: undefined,
    activeView: 'channels',
    entityListPaneOpen: true,
    mode: 'default',
    slotBindings: {},
    slotMeta: {},
    visibleSlots: ['slot1', 'slot2'],
    ...overrides,
  });

  it('prefers requestedSlot when provided', () => {
    const slot = resolveTargetSlotChannelDefault({
      binding: makeBinding('channel', makeChannel('messaging:one')),
      requestedSlot: 'slot2',
      state: makeState({}),
    });

    expect(slot).toBe('slot2');
  });

  it('replaces thread slot first when opening a channel into a full workspace', () => {
    const state = makeState({
      slotBindings: {
        slot1: makeBinding('channel', makeChannel('messaging:one')),
        slot2: makeBinding('thread', makeThread('thread-1')),
      },
    });

    const slot = resolveTargetSlotChannelDefault({
      binding: makeBinding('channel', makeChannel('messaging:two')),
      state,
    });

    expect(slot).toBe('slot2');
  });

  it('falls back to earliest occupied slot when only channels are present', () => {
    const state = makeState({
      slotBindings: {
        slot1: makeBinding('channel', makeChannel('messaging:one')),
        slot2: makeBinding('channel', makeChannel('messaging:two')),
      },
      slotMeta: {
        slot1: { occupiedAt: 10 },
        slot2: { occupiedAt: 20 },
      },
    });

    const slot = resolveTargetSlotChannelDefault({
      binding: makeBinding('channel', makeChannel('messaging:three')),
      state,
    });

    expect(slot).toBe('slot1');
  });
});
