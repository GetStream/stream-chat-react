import { fromPartial } from '@total-typescript/shoehorn';

import { createChatViewSlotBinding } from '../slotBinding';
import {
  applySlotStack,
  closeReplyThreads,
  findInStack,
  isStackEmpty,
  moveToTop,
  readSlotStack,
  topOfStack,
} from '../slotStack';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { LayoutController } from '../layoutController/layoutControllerTypes';

const makeChannel = (cid: string) => ({ cid }) as unknown as StreamChannel;
const channelEntry = (channel: StreamChannel) =>
  createChatViewSlotBinding({ key: channel.cid, kind: 'channel', source: channel });
const threadEntry = (id: string, channel: StreamChannel) =>
  createChatViewSlotBinding({
    key: id,
    kind: 'thread',
    source: { channel, id } as unknown as StreamThread,
  });
const profileEntry = (userId: string) =>
  createChatViewSlotBinding({ key: userId, kind: 'userProfile', source: { userId } });

const primary = makeChannel('messaging:primary');
const other = makeChannel('messaging:other');
const channel = channelEntry(other);
const primaryThread = threadEntry('primary-thread', primary);
const otherThread = threadEntry('other-thread', other);
const profile = profileEntry('user-1');

describe('slotStack', () => {
  it('reads a slot as its base and layers', () => {
    const viewState = {
      slotBindings: { slot1: channel },
      slotLayers: { slot1: [profile] },
    };

    expect(readSlotStack(viewState, 'slot1')).toEqual({
      base: channel,
      layers: [profile],
    });
    expect(readSlotStack(viewState, 'slot2')).toEqual({ base: undefined, layers: [] });
    expect(isStackEmpty(readSlotStack(viewState, 'slot2'))).toBe(true);
    expect(readSlotStack({ slotBindings: { slot1: channel } }, 'slot1')).toEqual({
      base: channel,
      layers: [],
    });
  });

  it('shows the top layer, or the base without layers', () => {
    expect(topOfStack({ base: channel, layers: [profile] })).toBe(profile);
    expect(topOfStack({ base: channel, layers: [] })).toBe(channel);
    expect(topOfStack({ layers: [] })).toBeUndefined();
  });

  it('finds an entity by kind and key, counting the base as 0', () => {
    const stack = { base: channel, layers: [primaryThread, profile] };

    expect(
      findInStack(stack, {
        key: 'user-1',
        kind: 'userProfile',
        source: { userId: 'user-1' },
      }),
    ).toBe(2);
    expect(findInStack(stack, { key: 'user-1', kind: 'channel', source: other })).toBe(
      -1,
    );
  });

  describe('moveToTop', () => {
    it('moves a layer to the top, keeping the others in order', () => {
      const stack = { base: channel, layers: [primaryThread, profile] };

      expect(moveToTop(stack, 1, primaryThread)).toEqual({
        base: channel,
        layers: [profile, primaryThread],
      });
    });

    it('moves the base to the top, making the entry above it the base', () => {
      const stack = { base: channel, layers: [profile] };

      expect(moveToTop(stack, 0, channel)).toEqual({ base: profile, layers: [channel] });
    });

    it('keeps a stack without a base without one', () => {
      const stack = { base: undefined, layers: [primaryThread, profile] };

      expect(moveToTop(stack, 1, primaryThread)).toEqual({
        layers: [profile, primaryThread],
      });
    });
  });

  describe('closeReplyThreads', () => {
    // `channel` holds the `other` conversation.
    it("closes the replaced channel's threads anywhere in the layers", () => {
      const stack = { base: channel, layers: [otherThread, primaryThread, profile] };

      expect(closeReplyThreads(stack, primary)).toEqual({
        base: channel,
        layers: [primaryThread, profile],
      });
    });

    it('keeps the threads of the channel opened again', () => {
      const stack = { base: channel, layers: [otherThread] };

      expect(closeReplyThreads(stack, makeChannel('messaging:other'))).toBe(stack);
    });

    it('closes a replaced thread, making the layer above it the base', () => {
      const stack = { base: otherThread, layers: [profile, channel] };

      expect(closeReplyThreads(stack, primary)).toEqual({
        base: profile,
        layers: [channel],
      });
    });

    it('leaves no base when the replaced thread has no layers', () => {
      expect(closeReplyThreads({ base: otherThread, layers: [] }, primary)).toEqual({
        base: undefined,
        layers: [],
      });
    });

    it('leaves a stack whose base is neither a channel nor a thread as it is', () => {
      const stack = { base: profile, layers: [otherThread] };

      expect(closeReplyThreads(stack, primary)).toBe(stack);
      expect(closeReplyThreads({ layers: [] }, primary)).toEqual({ layers: [] });
    });
  });

  describe('applySlotStack', () => {
    const makeController = () => {
      const calls: string[] = [];
      const controller = fromPartial<LayoutController>({
        bind: (_slot, binding) => calls.push(`bind ${binding.key}`),
        popLayer: () => calls.push('pop'),
        pushLayer: (_slot, binding) => calls.push(`push ${binding.key}`),
        release: () => calls.push('release'),
      });
      return { calls, controller };
    };

    it('leaves the layers below the first change in place', () => {
      const { calls, controller } = makeController();

      applySlotStack(
        controller,
        'slot2',
        { base: channel, layers: [profile, primaryThread, otherThread] },
        { base: channel, layers: [profile, otherThread] },
      );

      expect(calls).toEqual(['pop', 'pop', `push ${otherThread.key}`]);
    });

    it('binds a new base', () => {
      const { calls, controller } = makeController();

      applySlotStack(
        controller,
        'slot2',
        { base: primaryThread, layers: [profile] },
        { base: profile, layers: [] },
      );

      expect(calls).toEqual([`bind ${profile.key}`, 'pop']);
    });

    it('binds a base into a slot that had none', () => {
      const { calls, controller } = makeController();

      applySlotStack(
        controller,
        'slot2',
        { layers: [profile] },
        { base: channel, layers: [profile] },
      );

      expect(calls).toEqual([`bind ${channel.key}`]);
    });

    it('releases a slot left without a base', () => {
      const { calls, controller } = makeController();

      applySlotStack(
        controller,
        'slot2',
        { base: primaryThread, layers: [] },
        { base: undefined, layers: [] },
      );

      expect(calls).toEqual(['release']);
    });

    it('changes nothing when the stack is the same', () => {
      const { calls, controller } = makeController();
      const stack = { base: channel, layers: [profile] };

      applySlotStack(controller, 'slot2', stack, { ...stack, layers: [...stack.layers] });

      expect(calls).toEqual([]);
    });
  });
});
