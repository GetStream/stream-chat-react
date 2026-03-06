import type {
  ChatViewLayoutSnapshot,
  ChatViewLayoutState,
  DeserializeLayoutEntityBinding,
  RestoreLayoutStateOptions,
  SerializeLayoutEntityBinding,
  SerializeLayoutStateOptions,
} from './layoutControllerTypes';
import type {
  LayoutController,
  SerializedLayoutSlotBinding,
} from './layoutControllerTypes';
import type { ChatView } from '../ChatView';

type SlotBindingsByViewState = NonNullable<ChatViewLayoutState['slotBindingsByView']>;
type SlotHistoryByViewState = NonNullable<ChatViewLayoutState['slotHistoryByView']>;
type SlotForwardHistoryByViewState = NonNullable<
  ChatViewLayoutState['slotForwardHistoryByView']
>;

const defaultSerializeEntityBinding: SerializeLayoutEntityBinding = (binding) => ({
  key: binding.key,
  payload: binding.payload,
});

const defaultDeserializeEntityBinding: DeserializeLayoutEntityBinding = (binding) =>
  binding;

const serializeBindingsByView = ({
  bindingsByView,
  serializeEntityBinding,
}: {
  bindingsByView: ChatViewLayoutState['slotBindingsByView'];
  serializeEntityBinding: SerializeLayoutEntityBinding;
}) =>
  Object.entries(bindingsByView ?? {}).reduce<
    ChatViewLayoutSnapshot['slotBindingsByView']
  >((next, [view, bindings]) => {
    next[view as ChatView] = Object.entries(bindings ?? {}).reduce<
      Record<string, SerializedLayoutSlotBinding | undefined>
    >((acc, [slot, binding]) => {
      acc[slot] = binding ? serializeEntityBinding(binding) : undefined;
      return acc;
    }, {});
    return next;
  }, {});

const deserializeBindingsByView = ({
  bindingsByView,
  deserializeEntityBinding,
}: {
  bindingsByView: ChatViewLayoutSnapshot['slotBindingsByView'];
  deserializeEntityBinding: DeserializeLayoutEntityBinding;
}) =>
  Object.entries(bindingsByView ?? {}).reduce<SlotBindingsByViewState>(
    (next, [view, bindings]) => {
      next[view as ChatView] = Object.entries(bindings ?? {}).reduce<
        Record<string, ReturnType<DeserializeLayoutEntityBinding> | undefined>
      >((acc, [slot, binding]) => {
        acc[slot] = binding ? deserializeEntityBinding(binding) : undefined;
        return acc;
      }, {});
      return next;
    },
    {},
  );

const serializeHistoryByView = ({
  historyByView,
  serializeEntityBinding,
}: {
  historyByView:
    | ChatViewLayoutState['slotHistoryByView']
    | ChatViewLayoutState['slotForwardHistoryByView'];
  serializeEntityBinding: SerializeLayoutEntityBinding;
}) =>
  Object.entries(historyByView ?? {}).reduce<ChatViewLayoutSnapshot['slotHistoryByView']>(
    (next, [view, history]) => {
      next[view as ChatView] = Object.entries(history ?? {}).reduce<
        Record<string, SerializedLayoutSlotBinding[] | undefined>
      >((acc, [slot, entities]) => {
        if (!entities?.length) {
          acc[slot] = undefined;
          return acc;
        }
        const serializedEntities = entities
          .map(serializeEntityBinding)
          .filter((binding): binding is SerializedLayoutSlotBinding => !!binding);
        acc[slot] = serializedEntities.length ? serializedEntities : undefined;
        return acc;
      }, {});
      return next;
    },
    {},
  );

const deserializeHistoryByView = ({
  deserializeEntityBinding,
  historyByView,
}: {
  historyByView:
    | ChatViewLayoutSnapshot['slotHistoryByView']
    | ChatViewLayoutSnapshot['slotForwardHistoryByView'];
  deserializeEntityBinding: DeserializeLayoutEntityBinding;
}) =>
  Object.entries(historyByView ?? {}).reduce<SlotHistoryByViewState>(
    (next, [view, history]) => {
      next[view as ChatView] = Object.entries(history ?? {}).reduce<
        Record<
          string,
          NonNullable<ReturnType<DeserializeLayoutEntityBinding>>[] | undefined
        >
      >((acc, [slot, entities]) => {
        if (!entities?.length) {
          acc[slot] = undefined;
          return acc;
        }
        const deserializedEntities = entities
          .map(deserializeEntityBinding)
          .filter((binding): binding is NonNullable<typeof binding> => !!binding);
        acc[slot] = deserializedEntities.length ? deserializedEntities : undefined;
        return acc;
      }, {});
      return next;
    },
    {},
  );

export const serializeLayoutState = (
  state: ChatViewLayoutState,
  options: SerializeLayoutStateOptions = {},
): ChatViewLayoutSnapshot => {
  const serializeEntityBinding =
    options.serializeEntityBinding ?? defaultSerializeEntityBinding;

  return {
    activeView: state.activeView,
    availableSlotsByView: {
      ...(state.availableSlotsByView ?? {}),
    },
    hiddenSlotsByView: {
      ...(state.hiddenSlotsByView ?? {}),
    },
    listSlotByView: {
      ...(state.listSlotByView ?? {}),
    },
    slotBindingsByView: serializeBindingsByView({
      bindingsByView: state.slotBindingsByView,
      serializeEntityBinding,
    }),
    slotForwardHistoryByView: serializeHistoryByView({
      historyByView: state.slotForwardHistoryByView,
      serializeEntityBinding,
    }),
    slotHistoryByView: serializeHistoryByView({
      historyByView: state.slotHistoryByView,
      serializeEntityBinding,
    }),
    slotMetaByView: {
      ...(state.slotMetaByView ?? {}),
    },
    slotNamesByView: {
      ...(state.slotNamesByView ?? {}),
    },
  };
};

export const restoreLayoutState = (
  snapshot: ChatViewLayoutSnapshot,
  options: RestoreLayoutStateOptions = {},
): ChatViewLayoutState => {
  const deserializeEntityBinding =
    options.deserializeEntityBinding ?? defaultDeserializeEntityBinding;

  return {
    activeView: snapshot.activeView,
    availableSlotsByView: {
      ...(snapshot.availableSlotsByView ?? {}),
    },
    hiddenSlotsByView: {
      ...(snapshot.hiddenSlotsByView ?? {}),
    },
    listSlotByView: {
      ...(snapshot.listSlotByView ?? {}),
    },
    slotBindingsByView: deserializeBindingsByView({
      bindingsByView: snapshot.slotBindingsByView,
      deserializeEntityBinding,
    }),
    slotForwardHistoryByView: deserializeHistoryByView({
      deserializeEntityBinding,
      historyByView: snapshot.slotForwardHistoryByView,
    }) as SlotForwardHistoryByViewState,
    slotHistoryByView: deserializeHistoryByView({
      deserializeEntityBinding,
      historyByView: snapshot.slotHistoryByView,
    }) as SlotHistoryByViewState,
    slotMetaByView: {
      ...(snapshot.slotMetaByView ?? {}),
    },
    slotNamesByView: {
      ...(snapshot.slotNamesByView ?? {}),
    },
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
