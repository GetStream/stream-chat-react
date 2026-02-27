import type {
  ChatViewLayoutSnapshot,
  ChatViewLayoutState,
  DeserializeLayoutSlotBinding,
  RestoreLayoutStateOptions,
  SerializeLayoutSlotBinding,
  SerializeLayoutStateOptions,
} from './layoutControllerTypes';
import type { LayoutController } from './layoutControllerTypes';
import type { SerializedLayoutSlotBinding } from './layoutControllerTypes';

type LayoutStateSlotHistory = NonNullable<ChatViewLayoutState['slotHistory']>;
type LayoutSnapshotSlotHistory = ChatViewLayoutSnapshot['slotHistory'];

const defaultSerializeSlotBinding: SerializeLayoutSlotBinding = (binding) => ({
  key: binding.key,
  payload: binding.payload,
});

const defaultDeserializeSlotBinding: DeserializeLayoutSlotBinding = (binding) => binding;

const serializeSlotHistory = ({
  serializeSlotBinding,
  slotHistory,
}: {
  serializeSlotBinding: SerializeLayoutSlotBinding;
  slotHistory: ChatViewLayoutState['slotHistory'];
}) =>
  Object.entries(slotHistory ?? {}).reduce<LayoutSnapshotSlotHistory>(
    (nextHistory, [slot, entities]) => {
      if (!entities?.length) return nextHistory;

      const serializedEntities = entities
        .map(serializeSlotBinding)
        .filter(
          (binding): binding is SerializedLayoutSlotBinding => binding !== undefined,
        );

      nextHistory[slot] = serializedEntities.length ? serializedEntities : undefined;

      return nextHistory;
    },
    {},
  );

const deserializeSlotHistory = ({
  deserializeSlotBinding,
  slotHistory,
}: {
  deserializeSlotBinding: DeserializeLayoutSlotBinding;
  slotHistory: LayoutSnapshotSlotHistory;
}) =>
  Object.entries(slotHistory).reduce<LayoutStateSlotHistory>(
    (nextHistory, [slot, entities]) => {
      if (!entities?.length) return nextHistory;

      const deserializedEntities = entities
        .map(deserializeSlotBinding)
        .filter(
          (binding): binding is NonNullable<typeof binding> => binding !== undefined,
        );

      if (deserializedEntities.length) {
        nextHistory[slot] = deserializedEntities;
      }

      return nextHistory;
    },
    {},
  );

export const serializeLayoutState = (
  state: ChatViewLayoutState,
  options: SerializeLayoutStateOptions = {},
): ChatViewLayoutSnapshot => {
  const serializeSlotBinding =
    options.serializeSlotBinding ??
    options.serializeEntityBinding ??
    defaultSerializeSlotBinding;

  const slotBindings = state.visibleSlots.reduce<ChatViewLayoutSnapshot['slotBindings']>(
    (nextBindings, slot) => {
      const binding = state.slotBindings[slot];
      if (!binding) {
        nextBindings[slot] = undefined;
        return nextBindings;
      }

      nextBindings[slot] = serializeSlotBinding(binding);
      return nextBindings;
    },
    {},
  );

  return {
    activeSlot: state.activeSlot,
    activeView: state.activeView,
    entityListPaneOpen: state.entityListPaneOpen,
    hiddenSlots: {
      ...(state.hiddenSlots ?? {}),
    },
    mode: state.mode,
    slotBindings,
    slotHistory: serializeSlotHistory({
      serializeSlotBinding,
      slotHistory: state.slotHistory,
    }),
    slotMeta: {
      ...state.slotMeta,
    },
    visibleSlots: [...state.visibleSlots],
  };
};

export const restoreLayoutState = (
  snapshot: ChatViewLayoutSnapshot,
  options: RestoreLayoutStateOptions = {},
): ChatViewLayoutState => {
  const deserializeSlotBinding =
    options.deserializeSlotBinding ??
    options.deserializeEntityBinding ??
    defaultDeserializeSlotBinding;

  const slotBindings = Object.entries(snapshot.slotBindings).reduce<
    ChatViewLayoutState['slotBindings']
  >((nextBindings, [slot, entity]) => {
    nextBindings[slot] = entity ? deserializeSlotBinding(entity) : undefined;
    return nextBindings;
  }, {});

  return {
    activeSlot: snapshot.activeSlot,
    activeView: snapshot.activeView,
    entityListPaneOpen: snapshot.entityListPaneOpen,
    hiddenSlots: {
      ...snapshot.hiddenSlots,
    },
    mode: snapshot.mode,
    slotBindings,
    slotHistory: deserializeSlotHistory({
      deserializeSlotBinding,
      slotHistory: snapshot.slotHistory,
    }),
    slotMeta: {
      ...snapshot.slotMeta,
    },
    visibleSlots: [...snapshot.visibleSlots],
  };
};

export const serializeLayoutControllerState = (
  controller: LayoutController,
  options?: SerializeLayoutStateOptions,
) => serializeLayoutState(controller.state.getLatestValue(), options);

export const restoreLayoutControllerState = (
  controller: LayoutController,
  snapshot: ChatViewLayoutSnapshot,
  options?: RestoreLayoutStateOptions,
) => {
  controller.state.next(() => restoreLayoutState(snapshot, options));
};
