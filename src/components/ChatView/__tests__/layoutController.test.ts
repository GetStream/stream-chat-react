import { LayoutController } from '../layoutController/LayoutController';
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
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
      resolveTargetSlot: () => 'slot1',
    });

    const firstOpen = controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
    );
    const secondOpen = controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:two'), 'messaging:two'),
    );
    controller.clear('slot1');
    const rejectedOpen = controller.openInLayout(
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
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
    );
    const occupiedAt = controller.state.getLatestValue().slotMeta.slot1?.occupiedAt;
    controller.clear('slot1');

    expect(typeof occupiedAt).toBe('number');
    expect(controller.state.getLatestValue().slotMeta.slot1).toBeUndefined();
  });

  it('prefers replacing same-kind slot over binding into a free slot', () => {
    const firstThread = makeBinding('thread', makeThread('thread-1'), 'thread-1');
    const secondThread = makeBinding('thread', makeThread('thread-2'), 'thread-2');
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
        slotBindings: {
          slot1: firstThread,
        },
      },
    });

    const result = controller.openInLayout(secondThread);
    const state = controller.state.getLatestValue();

    expect(result).toMatchObject({ slot: 'slot1', status: 'replaced' });
    expect(state.slotBindings.slot2).toBeUndefined();
    expect(state.slotHistory?.slot1).toEqual([firstThread]);
  });

  it('supports duplicateEntityPolicy reject and move', () => {
    const rejectController = new LayoutController({
      duplicateEntityPolicy: 'reject',
      initialState: { availableSlots: ['slot1', 'slot2'] },
      resolveTargetSlot: () => 'slot2',
    });
    const duplicateChannel = makeChannel('messaging:duplicate');

    rejectController.openInLayout(
      makeBinding('channel', duplicateChannel, duplicateChannel.cid),
      {
        targetSlot: 'slot1',
      },
    );
    const rejectResult = rejectController.openInLayout(
      makeBinding('channel', duplicateChannel, duplicateChannel.cid),
      {
        targetSlot: 'slot2',
      },
    );

    expect(rejectResult).toMatchObject({
      reason: 'duplicate-binding',
      status: 'rejected',
    });

    const moveController = new LayoutController({
      duplicateEntityPolicy: 'move',
      initialState: { availableSlots: ['slot1', 'slot2'] },
    });

    moveController.openInLayout(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
      {
        targetSlot: 'slot1',
      },
    );
    moveController.openInLayout(
      makeBinding('channel', makeChannel('messaging:two'), 'messaging:two'),
      {
        targetSlot: 'slot2',
      },
    );
    moveController.openInLayout(
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

  it('openView updates activeView', () => {
    const controller = new LayoutController({
      initialState: {
        activeView: 'channels',
        availableSlots: ['slot1', 'slot2'],
      },
    });

    controller.openView('threads');
    expect(controller.state.getLatestValue()).toMatchObject({
      activeView: 'threads',
    });

    controller.openView('channels', { slot: 'slot2' });
    expect(controller.state.getLatestValue()).toMatchObject({
      activeView: 'channels',
    });
  });

  it('serializes and restores hidden slots and serializable bindings', () => {
    const sourceController = new LayoutController({
      initialState: {
        availableSlots: ['slot1', 'slot2'],
        hiddenSlots: { slot1: true },
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

    const restoreController = new LayoutController({
      initialState: { availableSlots: ['slot1', 'slot2'] },
    });
    restoreLayoutControllerState(restoreController, snapshot);

    expect(restoreController.state.getLatestValue()).toMatchObject({
      hiddenSlots: { slot1: true },
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

  it('goBack and goForward navigate independently per slot', () => {
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });
    const first = makeBinding(
      'channel',
      makeChannel('messaging:first'),
      'messaging:first',
    );
    const second = makeBinding(
      'channel',
      makeChannel('messaging:second'),
      'messaging:second',
    );

    controller.openInLayout(first, { targetSlot: 'slot1' });
    controller.openInLayout(second, { targetSlot: 'slot1' });
    controller.goBack('slot1');

    expect(controller.state.getLatestValue().slotBindings.slot1).toEqual(first);
    expect(controller.state.getLatestValue().slotForwardHistory?.slot1).toEqual([second]);

    controller.goForward('slot1');
    expect(controller.state.getLatestValue().slotBindings.slot1).toEqual(second);
  });

  it('does not duplicate history when replacing slot and top history already equals current', () => {
    const currentBinding = makeBinding(
      'channel',
      makeChannel('messaging:current'),
      'messaging:current',
    );

    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
        slotBindings: {
          slot1: currentBinding,
        },
        slotHistory: {
          slot1: [currentBinding],
        },
      },
      resolveTargetSlot: () => 'slot1',
    });

    controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:next'), 'messaging:next'),
      { targetSlot: 'slot1' },
    );

    expect(controller.state.getLatestValue().slotHistory?.slot1).toEqual([
      currentBinding,
    ]);
  });

  it('clears forward history on write after going back', () => {
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });
    const first = makeBinding(
      'channel',
      makeChannel('messaging:first'),
      'messaging:first',
    );
    const second = makeBinding(
      'channel',
      makeChannel('messaging:second'),
      'messaging:second',
    );
    const third = makeBinding(
      'channel',
      makeChannel('messaging:third'),
      'messaging:third',
    );

    controller.openInLayout(first, { targetSlot: 'slot1' });
    controller.openInLayout(second, { targetSlot: 'slot1' });
    controller.goBack('slot1');
    controller.openInLayout(third, { targetSlot: 'slot1' });

    expect(controller.state.getLatestValue().slotForwardHistory?.slot1).toBeUndefined();
  });
});

describe('resolveTargetSlotChannelDefault', () => {
  const makeState = (overrides: Partial<ChatViewLayoutState>): ChatViewLayoutState => ({
    activeView: 'channels',
    availableSlots: ['slot1', 'slot2'],
    slotBindings: {},
    slotForwardHistory: {},
    slotHistory: {},
    slotMeta: {},
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

  it('prefers existing channel slot over channelList slot for channel opens', () => {
    const state = makeState({
      availableSlots: ['list', 'channel'],
      slotBindings: {
        channel: makeBinding('channel', makeChannel('messaging:one')),
        list: makeBinding('channelList', { view: 'channels' }),
      },
      slotMeta: {
        channel: { occupiedAt: 20 },
        list: { occupiedAt: 10 },
      },
    });

    const slot = resolveTargetSlotChannelDefault({
      binding: makeBinding('channel', makeChannel('messaging:two')),
      state,
    });

    expect(slot).toBe('channel');
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
