import type {
  ChatViewLayoutSnapshot,
  ChatViewLayoutState,
  DeserializeLayoutEntityBinding,
  LayoutController,
  LayoutRuntimeState,
  RestoreLayoutStateOptions,
  SerializedLayoutRuntimeState,
  SerializedLayoutSlotBinding,
  SerializeLayoutEntityBinding,
  SerializeLayoutStateOptions,
} from './layoutControllerTypes';
import type { ChatView } from '../ChatView';

const defaultSerializeEntityBinding: SerializeLayoutEntityBinding = (binding) => ({
  key: binding.key,
  payload: binding.payload,
});

const defaultDeserializeEntityBinding: DeserializeLayoutEntityBinding = (binding) =>
  binding;

const serializeBindings = (
  bindings: LayoutRuntimeState['slotBindings'],
  serializeEntityBinding: SerializeLayoutEntityBinding,
) =>
  Object.entries(bindings ?? {}).reduce<
    Record<string, SerializedLayoutSlotBinding | undefined>
  >((acc, [slot, binding]) => {
    acc[slot] = binding ? serializeEntityBinding(binding) : undefined;
    return acc;
  }, {});

const serializeHistory = (
  history: LayoutRuntimeState['slotHistory'],
  serializeEntityBinding: SerializeLayoutEntityBinding,
) =>
  Object.entries(history ?? {}).reduce<
    Record<string, SerializedLayoutSlotBinding[] | undefined>
  >((acc, [slot, entities]) => {
    if (!entities?.length) {
      acc[slot] = undefined;
      return acc;
    }
    const serialized = entities
      .map(serializeEntityBinding)
      .filter((binding): binding is SerializedLayoutSlotBinding => !!binding);
    acc[slot] = serialized.length ? serialized : undefined;
    return acc;
  }, {});

const serializeRuntimeState = (
  runtime: LayoutRuntimeState,
  serializeEntityBinding: SerializeLayoutEntityBinding,
): SerializedLayoutRuntimeState => ({
  availableSlots: [...runtime.availableSlots],
  hiddenSlots: { ...runtime.hiddenSlots },
  slotBindings: serializeBindings(runtime.slotBindings, serializeEntityBinding),
  slotForwardHistory: serializeHistory(
    runtime.slotForwardHistory,
    serializeEntityBinding,
  ),
  slotHistory: serializeHistory(runtime.slotHistory, serializeEntityBinding),
  slotMeta: { ...runtime.slotMeta },
  slotNames: runtime.slotNames ? [...runtime.slotNames] : undefined,
});

const deserializeBindings = (
  bindings: SerializedLayoutRuntimeState['slotBindings'],
  deserializeEntityBinding: DeserializeLayoutEntityBinding,
) =>
  Object.entries(bindings ?? {}).reduce<LayoutRuntimeState['slotBindings']>(
    (acc, [slot, binding]) => {
      acc[slot] = binding ? deserializeEntityBinding(binding) : undefined;
      return acc;
    },
    {},
  );

const deserializeHistory = (
  history: SerializedLayoutRuntimeState['slotHistory'],
  deserializeEntityBinding: DeserializeLayoutEntityBinding,
) =>
  Object.entries(history ?? {}).reduce<LayoutRuntimeState['slotHistory']>(
    (acc, [slot, entities]) => {
      if (!entities?.length) {
        acc[slot] = undefined;
        return acc;
      }
      const deserialized = entities
        .map(deserializeEntityBinding)
        .filter((binding): binding is NonNullable<typeof binding> => !!binding);
      acc[slot] = deserialized.length ? deserialized : undefined;
      return acc;
    },
    {},
  );

const deserializeRuntimeState = (
  runtime: SerializedLayoutRuntimeState,
  deserializeEntityBinding: DeserializeLayoutEntityBinding,
): LayoutRuntimeState => ({
  availableSlots: [...runtime.availableSlots],
  hiddenSlots: { ...runtime.hiddenSlots },
  slotBindings: deserializeBindings(runtime.slotBindings, deserializeEntityBinding),
  slotForwardHistory: deserializeHistory(
    runtime.slotForwardHistory,
    deserializeEntityBinding,
  ),
  slotHistory: deserializeHistory(runtime.slotHistory, deserializeEntityBinding),
  slotMeta: { ...runtime.slotMeta },
  slotNames: runtime.slotNames ? [...runtime.slotNames] : undefined,
});

export const serializeLayoutState = (
  state: ChatViewLayoutState,
  options: SerializeLayoutStateOptions = {},
): ChatViewLayoutSnapshot => {
  const serializeEntityBinding =
    options.serializeEntityBinding ?? defaultSerializeEntityBinding;

  const layouts = Object.entries(state.layouts ?? {}).reduce<
    ChatViewLayoutSnapshot['layouts']
  >((acc, [view, runtime]) => {
    if (runtime) {
      acc[view as ChatView] = serializeRuntimeState(runtime, serializeEntityBinding);
    }
    return acc;
  }, {});

  return { activeView: state.activeView, layouts };
};

export const restoreLayoutState = (
  snapshot: ChatViewLayoutSnapshot,
  options: RestoreLayoutStateOptions = {},
): ChatViewLayoutState => {
  const deserializeEntityBinding =
    options.deserializeEntityBinding ?? defaultDeserializeEntityBinding;

  const layouts = Object.entries(snapshot.layouts ?? {}).reduce<
    NonNullable<ChatViewLayoutState['layouts']>
  >((acc, [view, runtime]) => {
    if (runtime) {
      acc[view as ChatView] = deserializeRuntimeState(runtime, deserializeEntityBinding);
    }
    return acc;
  }, {});

  return { activeView: snapshot.activeView, layouts };
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
