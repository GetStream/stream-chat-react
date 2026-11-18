// A slot's content seen as one stack: the base binding at the bottom, its layers above it. The
// functions here compute the next stack without side effects; `applySlotStack` then writes the
// difference to the layout controller. Internal to the SlotLayout plugin: `index.tsx` does not
// re-export it.

import { getChatViewEntityBinding } from './slotBinding';

import type { Channel as StreamChannel } from 'stream-chat';
import type { ChatViewEntityBinding } from './slotBinding';
import type {
  ChatViewLayoutViewState,
  LayoutController,
  LayoutSlotBinding,
  SlotName,
} from './layoutController/layoutControllerTypes';

export type SlotStack = {
  /** The slot's base binding, if any. */
  base?: LayoutSlotBinding;
  /** The layers over the base, bottom to top. */
  layers: LayoutSlotBinding[];
};

export const readSlotStack = (
  viewState: Pick<ChatViewLayoutViewState, 'slotBindings' | 'slotLayers'>,
  slot: SlotName,
): SlotStack => ({
  base: viewState.slotBindings[slot],
  layers: viewState.slotLayers?.[slot] ?? [],
});

export const isStackEmpty = (stack: SlotStack) => !stack.base && !stack.layers.length;

/** The binding shown in the slot: the top layer, or the base when there are no layers. */
export const topOfStack = (stack: SlotStack) => stack.layers.at(-1) ?? stack.base;

/**
 * Where the stack holds `entity` (same kind and key), counting the base as 0 and layers from 1.
 * -1 when it is not held.
 */
export const findInStack = (stack: SlotStack, entity: ChatViewEntityBinding) =>
  [stack.base, ...stack.layers].findIndex((binding) => {
    const held = getChatViewEntityBinding(binding);
    return held?.kind === entity.kind && held.key === entity.key;
  });

/**
 * Takes the entry at `index` (as returned by `findInStack`) out of the stack and puts `entry` on
 * top. The rest keeps its order; a stack with a base keeps one, so the entry above a moved base
 * becomes the base.
 */
export const moveToTop = (
  stack: SlotStack,
  index: number,
  entry: LayoutSlotBinding,
): SlotStack => {
  const rest = [stack.base, ...stack.layers].filter(
    (binding, at): binding is LayoutSlotBinding => !!binding && at !== index,
  );
  const next = [...rest, entry];
  return stack.base ? { base: next[0], layers: next.slice(1) } : { layers: next };
};

/**
 * The stack left once `openingChannel` replaces the slot's base, before it is bound. Replacing a
 * channel closes that channel's reply threads in the layers, which would otherwise cover the channel
 * that replaces it; reopening the same channel (by `cid`, its conversation) keeps them. Replacing
 * a thread closes it, and the layer right above it becomes the base.
 */
export const closeReplyThreads = (
  stack: SlotStack,
  openingChannel: StreamChannel,
): SlotStack => {
  const replaced = getChatViewEntityBinding(stack.base);

  if (replaced?.kind === 'thread') {
    const [base, ...layers] = stack.layers;
    return { base, layers };
  }

  if (replaced?.kind !== 'channel') return stack;
  const replacedCid = replaced.source.cid;
  if (openingChannel.cid && replacedCid === openingChannel.cid) return stack;

  const isReplacedChannelThread = (binding: LayoutSlotBinding) => {
    const entity = getChatViewEntityBinding(binding);
    return entity?.kind === 'thread' && entity.source.channel?.cid === replacedCid;
  };
  return {
    base: stack.base,
    layers: stack.layers.filter((layer) => !isReplacedChannelThread(layer)),
  };
};

/**
 * Writes `next` to `slot`, where `current` is the slot's stack now. Layers below the first change
 * are left alone, so they stay mounted; the ones from there up are popped and the next ones pushed,
 * in order. A stack that loses its base is released, which also clears the slot's history.
 */
export const applySlotStack = (
  layoutController: LayoutController,
  slot: SlotName,
  current: SlotStack,
  next: SlotStack,
) => {
  let layers = current.layers;
  if (current.base && !next.base) {
    layoutController.release(slot);
    layers = [];
  } else if (next.base && next.base !== current.base) {
    layoutController.bind(slot, next.base);
  }

  let unchanged = 0;
  while (unchanged < next.layers.length && layers[unchanged] === next.layers[unchanged]) {
    unchanged += 1;
  }
  layers.slice(unchanged).forEach(() => layoutController.popLayer(slot));
  next.layers
    .slice(unchanged)
    .forEach((layer) => layoutController.pushLayer(slot, layer));
};
