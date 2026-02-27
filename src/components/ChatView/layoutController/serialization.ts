import type {
  ChatViewLayoutSnapshot,
  ChatViewLayoutState,
  DeserializeLayoutEntityBinding,
  RestoreLayoutStateOptions,
  SerializeLayoutEntityBinding,
  SerializeLayoutStateOptions,
} from './layoutControllerTypes';
import type { LayoutController } from './layoutControllerTypes';
import type { SerializedLayoutEntityBinding } from './layoutControllerTypes';

const isDefaultSerializableKind = (kind: SerializedLayoutEntityBinding['kind']) =>
  kind === 'channelList' || kind === 'userList' || kind === 'searchResults';

const defaultSerializeEntityBinding: SerializeLayoutEntityBinding = (entity) => {
  if (!isDefaultSerializableKind(entity.kind)) return;

  return {
    key: entity.key,
    kind: entity.kind,
    source: entity.source,
  };
};

const defaultDeserializeEntityBinding: DeserializeLayoutEntityBinding = (entity) => {
  if (!isDefaultSerializableKind(entity.kind)) return;

  return {
    key: entity.key,
    kind: entity.kind,
    source: entity.source,
  };
};

const serializeSlotHistory = ({
  serializeEntityBinding,
  slotHistory,
}: {
  serializeEntityBinding: SerializeLayoutEntityBinding;
  slotHistory: ChatViewLayoutState['slotHistory'];
}) =>
  Object.entries(slotHistory ?? {}).reduce<ChatViewLayoutSnapshot['slotHistory']>(
    (nextHistory, [slot, entities]) => {
      if (!entities?.length) return nextHistory;

      const serializedEntities = entities
        .map(serializeEntityBinding)
        .filter(
          (entity): entity is SerializedLayoutEntityBinding => entity !== undefined,
        );

      nextHistory[slot] = serializedEntities.length ? serializedEntities : undefined;

      return nextHistory;
    },
    {},
  );

const deserializeSlotHistory = ({
  deserializeEntityBinding,
  slotHistory,
}: {
  deserializeEntityBinding: DeserializeLayoutEntityBinding;
  slotHistory: ChatViewLayoutSnapshot['slotHistory'];
}) =>
  Object.entries(slotHistory).reduce<ChatViewLayoutState['slotHistory']>(
    (nextHistory, [slot, entities]) => {
      if (!entities?.length) return nextHistory;

      const deserializedEntities = entities
        .map(deserializeEntityBinding)
        .filter((entity): entity is NonNullable<typeof entity> => entity !== undefined);

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
  const serializeEntityBinding =
    options.serializeEntityBinding ?? defaultSerializeEntityBinding;

  const slotBindings = state.visibleSlots.reduce<ChatViewLayoutSnapshot['slotBindings']>(
    (nextBindings, slot) => {
      const binding = state.slotBindings[slot];
      if (!binding) {
        nextBindings[slot] = undefined;
        return nextBindings;
      }

      nextBindings[slot] = serializeEntityBinding(binding);
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
      serializeEntityBinding,
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
  const deserializeEntityBinding =
    options.deserializeEntityBinding ?? defaultDeserializeEntityBinding;

  const slotBindings = Object.entries(snapshot.slotBindings).reduce<
    ChatViewLayoutState['slotBindings']
  >((nextBindings, [slot, entity]) => {
    nextBindings[slot] = entity ? deserializeEntityBinding(entity) : undefined;
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
      deserializeEntityBinding,
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
