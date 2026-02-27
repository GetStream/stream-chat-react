import type {
  LayoutSlot,
  ResolveTargetSlot,
  ResolveTargetSlotArgs,
} from './layoutController/layoutControllerTypes';

export type SlotResolver = (args: ResolveTargetSlotArgs) => LayoutSlot | null;

export const requestedSlotResolver: SlotResolver = ({ requestedSlot }) =>
  requestedSlot ?? null;

export const firstFree: SlotResolver = ({ state }) =>
  state.visibleSlots.find((slot) => !state.slotBindings[slot]) ?? null;

export const existingThreadSlotForThread: SlotResolver = ({ entity, state }) => {
  if (entity.kind !== 'thread') return null;

  return (
    state.visibleSlots.find((slot) => state.slotBindings[slot]?.kind === 'thread') ?? null
  );
};

export const existingThreadSlotForChannel: SlotResolver = ({ entity, state }) => {
  if (entity.kind !== 'channel') return null;

  return (
    state.visibleSlots.find((slot) => state.slotBindings[slot]?.kind === 'thread') ?? null
  );
};

export const earliestOccupied: SlotResolver = ({ state }) => {
  const occupiedSlots = state.visibleSlots
    .map((slot) => ({
      occupiedAt: state.slotMeta[slot]?.occupiedAt ?? Number.POSITIVE_INFINITY,
      slot,
    }))
    .filter(({ occupiedAt }) => occupiedAt !== Number.POSITIVE_INFINITY)
    .sort((first, second) => first.occupiedAt - second.occupiedAt);

  return occupiedSlots[0]?.slot ?? null;
};

export const activeOrLast: SlotResolver = ({ activeSlot, state }) =>
  activeSlot ?? state.visibleSlots[state.visibleSlots.length - 1] ?? null;

export const replaceActive: SlotResolver = ({ activeSlot, state }) =>
  activeSlot ?? state.visibleSlots[state.visibleSlots.length - 1] ?? null;

export const replaceLast: SlotResolver = ({ state }) =>
  state.visibleSlots[state.visibleSlots.length - 1] ?? null;

export const rejectWhenFull: SlotResolver = () => null;

export const composeResolvers =
  (...resolvers: SlotResolver[]): ResolveTargetSlot =>
  (args) => {
    for (const resolver of resolvers) {
      const slot = resolver(args);
      if (slot) return slot;
    }

    return null;
  };

export const resolveTargetSlotChannelDefault = composeResolvers(
  requestedSlotResolver,
  firstFree,
  existingThreadSlotForThread,
  existingThreadSlotForChannel,
  earliestOccupied,
  activeOrLast,
);

export const layoutSlotResolvers = {
  activeOrLast,
  composeResolvers,
  earliestOccupied,
  existingThreadSlotForChannel,
  existingThreadSlotForThread,
  firstFree,
  rejectWhenFull,
  replaceActive,
  replaceLast,
  requestedSlotResolver,
  resolveTargetSlotChannelDefault,
} as const;
