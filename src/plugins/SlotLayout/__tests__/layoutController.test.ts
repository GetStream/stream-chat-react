import { LayoutController } from '../layoutController/LayoutController';
import {
  restoreLayoutControllerState,
  serializeLayoutControllerState,
} from '../layoutController/serialization';

import type { Channel as StreamChannel } from 'stream-chat';

// MERGE-RECONCILE (test migration): the LayoutController became a pure slot-mechanism controller.
// - `clear(slot)` is now `release(slot)`.
// - `openInLayout` no longer auto-resolves a target slot; the caller passes an explicit
//   `{ targetSlot }` (an occupied target is a replace, an unknown target is rejected). The default
//   kind-based slot resolution (formerly `resolveTargetSlotChannelDefault` from `../layoutSlotResolvers`)
//   moved into the navigation layer (`resolveDefaultTargetSlot` in ChatViewNavigationContext, not
//   exported) and is covered by ChatViewNavigation.test.tsx — the standalone resolver tests and the
//   "prefers replacing same-kind slot" open() test were dropped as obsolete for this layer.
// - Runtime slot state (bindings/history/meta/…) is now stored per-view under `layouts[activeView]`
//   instead of at the top level; reads go through the `viewState` helper below.

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const makeBinding = (kind: string, source: unknown, key?: string) => ({
  key,
  payload: { key, kind, source },
});

const viewState = (controller: LayoutController) => {
  const state = controller.state.getLatestValue();
  return state.layouts![state.activeView]!;
};

describe('layoutController', () => {
  it('returns opened, replaced, and rejected outcomes from openInLayout()', () => {
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    const firstOpen = controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
      { targetSlot: 'slot1' },
    );
    const secondOpen = controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:two'), 'messaging:two'),
      { targetSlot: 'slot1' },
    );
    controller.release('slot1');
    const rejectedOpen = controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:three'), 'messaging:three'),
      { targetSlot: 'missing' },
    );

    expect(firstOpen).toMatchObject({ slot: 'slot1', status: 'opened' });
    expect(secondOpen).toMatchObject({ slot: 'slot1', status: 'replaced' });
    expect(rejectedOpen).toMatchObject({
      reason: 'no-available-slot',
      status: 'rejected',
    });
  });

  it('tracks occupiedAt when slot becomes occupied and clears it on release()', () => {
    const controller = new LayoutController({
      initialState: {
        availableSlots: ['slot1'],
      },
    });

    controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:one'), 'messaging:one'),
      { targetSlot: 'slot1' },
    );
    const occupiedAt = viewState(controller).slotMeta.slot1?.occupiedAt;
    controller.release('slot1');

    expect(typeof occupiedAt).toBe('number');
    expect(viewState(controller).slotMeta.slot1).toBeUndefined();
    expect(viewState(controller).slotBindings.slot1).toBeUndefined();
  });

  it('supports duplicateEntityPolicy reject and move', () => {
    const rejectController = new LayoutController({
      duplicateEntityPolicy: 'reject',
      initialState: { availableSlots: ['slot1', 'slot2'] },
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

    const movedState = viewState(moveController);
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
    const snapshotView = snapshot.layouts.channels!;
    expect((snapshotView.slotBindings.slot1?.payload as { kind: string }).kind).toBe(
      'channelList',
    );
    expect((snapshotView.slotBindings.slot2?.payload as { kind: string }).kind).toBe(
      'channel',
    );
    expect(
      snapshotView.slotHistory.slot2?.map(
        (entry) => (entry.payload as { kind: string }).kind,
      ),
    ).toEqual(['searchResults', 'channel']);

    const restoreController = new LayoutController({
      initialState: { availableSlots: ['slot1', 'slot2'] },
    });
    restoreLayoutControllerState(restoreController, snapshot);

    expect(viewState(restoreController)).toMatchObject({
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

    expect(viewState(controller).slotBindings.slot1).toEqual(first);
    expect(viewState(controller).slotForwardHistory?.slot1).toEqual([second]);

    controller.goForward('slot1');
    expect(viewState(controller).slotBindings.slot1).toEqual(second);
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
    });

    controller.openInLayout(
      makeBinding('channel', makeChannel('messaging:next'), 'messaging:next'),
      { targetSlot: 'slot1' },
    );

    expect(viewState(controller).slotHistory?.slot1).toEqual([currentBinding]);
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

    expect(viewState(controller).slotForwardHistory?.slot1).toBeUndefined();
  });
});
