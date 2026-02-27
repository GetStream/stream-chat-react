import { createLayoutController } from '../layoutController/LayoutController';
import { resolveTargetSlotChannelDefault } from '../layoutSlotResolvers';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { ChatViewLayoutState } from '../layoutController/layoutControllerTypes';

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeThread = (id: string) => ({ id }) as unknown as StreamThread;

describe('layoutController', () => {
  it('returns opened, replaced, and rejected outcomes from open()', () => {
    const controller = createLayoutController({
      initialState: {
        visibleSlots: ['slot1'],
      },
      resolveTargetSlot: () => 'slot1',
    });

    const firstOpen = controller.openChannel(makeChannel('messaging:one'));
    const secondOpen = controller.openChannel(makeChannel('messaging:two'));
    controller.clear('slot1');
    const rejectedOpen = controller.openChannel(makeChannel('messaging:three'));

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

    controller.openChannel(makeChannel('messaging:one'));
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

    rejectController.openChannel(duplicateChannel, { targetSlot: 'slot1' });
    const rejectResult = rejectController.openChannel(duplicateChannel, {
      targetSlot: 'slot2',
    });

    expect(rejectResult).toMatchObject({
      reason: 'duplicate-entity',
      status: 'rejected',
    });

    const moveController = createLayoutController({
      duplicateEntityPolicy: 'move',
      initialState: { visibleSlots: ['slot1', 'slot2'] },
    });

    moveController.openChannel(makeChannel('messaging:one'), { targetSlot: 'slot1' });
    moveController.openChannel(makeChannel('messaging:two'), { targetSlot: 'slot2' });
    moveController.openChannel(makeChannel('messaging:one'), { targetSlot: 'slot2' });

    const movedState = moveController.state.getLatestValue();
    expect(movedState.slotBindings.slot1).toBeUndefined();
    expect(movedState.slotBindings.slot2?.kind).toBe('channel');
    expect((movedState.slotBindings.slot2?.source as StreamChannel).cid).toBe(
      'messaging:one',
    );
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
      entity: { kind: 'channel', source: makeChannel('messaging:one') },
      requestedSlot: 'slot2',
      state: makeState({}),
    });

    expect(slot).toBe('slot2');
  });

  it('replaces thread slot first when opening a channel into a full workspace', () => {
    const state = makeState({
      slotBindings: {
        slot1: { kind: 'channel', source: makeChannel('messaging:one') },
        slot2: { kind: 'thread', source: makeThread('thread-1') },
      },
    });

    const slot = resolveTargetSlotChannelDefault({
      entity: { kind: 'channel', source: makeChannel('messaging:two') },
      state,
    });

    expect(slot).toBe('slot2');
  });

  it('falls back to earliest occupied slot when only channels are present', () => {
    const state = makeState({
      slotBindings: {
        slot1: { kind: 'channel', source: makeChannel('messaging:one') },
        slot2: { kind: 'channel', source: makeChannel('messaging:two') },
      },
      slotMeta: {
        slot1: { occupiedAt: 10 },
        slot2: { occupiedAt: 20 },
      },
    });

    const slot = resolveTargetSlotChannelDefault({
      entity: { kind: 'channel', source: makeChannel('messaging:three') },
      state,
    });

    expect(slot).toBe('slot1');
  });
});
