import type {
  ResolveTargetSlot,
  ResolveTargetSlotArgs,
  SlotName,
} from './layoutController/layoutControllerTypes';

export type SlotResolver = (args: ResolveTargetSlotArgs) => SlotName | null;

export const requestedSlotResolver: SlotResolver = ({ requestedSlot }) =>
  requestedSlot ?? null;

export const firstFree: SlotResolver = ({ activeViewState }) =>
  activeViewState.availableSlots.find((slot) => !activeViewState.slotBindings[slot]) ??
  null;

const readBindingKind = (binding: ResolveTargetSlotArgs['binding'] | undefined) => {
  const payload = binding?.payload as { kind?: unknown } | undefined;
  return typeof payload?.kind === 'string' ? payload.kind : undefined;
};

export const existingThreadSlotForThread: SlotResolver = ({
  activeViewState,
  binding,
}) => {
  if (readBindingKind(binding) !== 'thread') return null;

  return (
    activeViewState.availableSlots.find(
      (slot) => readBindingKind(activeViewState.slotBindings[slot]) === 'thread',
    ) ?? null
  );
};

export const existingThreadSlotForChannel: SlotResolver = ({
  activeViewState,
  binding,
}) => {
  if (readBindingKind(binding) !== 'channel') return null;

  return (
    activeViewState.availableSlots.find(
      (slot) => readBindingKind(activeViewState.slotBindings[slot]) === 'thread',
    ) ?? null
  );
};

export const existingChannelSlotForChannel: SlotResolver = ({
  activeViewState,
  binding,
}) => {
  if (readBindingKind(binding) !== 'channel') return null;

  return (
    activeViewState.availableSlots.find(
      (slot) => readBindingKind(activeViewState.slotBindings[slot]) === 'channel',
    ) ?? null
  );
};

export const earliestOccupied: SlotResolver = ({ activeViewState }) => {
  const occupiedSlots = activeViewState.availableSlots
    .map((slot) => ({
      occupiedAt: activeViewState.slotMeta[slot]?.occupiedAt ?? Number.POSITIVE_INFINITY,
      slot,
    }))
    .filter(({ occupiedAt }) => occupiedAt !== Number.POSITIVE_INFINITY)
    .sort((first, second) => first.occupiedAt - second.occupiedAt);

  return occupiedSlots[0]?.slot ?? null;
};

export const activeOrLast: SlotResolver = ({ activeViewState }) =>
  activeViewState.availableSlots[activeViewState.availableSlots.length - 1] ?? null;

export const replaceActive: SlotResolver = ({ activeViewState }) =>
  activeViewState.availableSlots[activeViewState.availableSlots.length - 1] ?? null;

export const replaceLast: SlotResolver = ({ activeViewState }) =>
  activeViewState.availableSlots[activeViewState.availableSlots.length - 1] ?? null;

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
  existingChannelSlotForChannel,
  earliestOccupied,
  activeOrLast,
);

export const layoutSlotResolvers = {
  activeOrLast,
  composeResolvers,
  earliestOccupied,
  existingChannelSlotForChannel,
  existingThreadSlotForChannel,
  existingThreadSlotForThread,
  firstFree,
  rejectWhenFull,
  replaceActive,
  replaceLast,
  requestedSlotResolver,
  resolveTargetSlotChannelDefault,
} as const;
