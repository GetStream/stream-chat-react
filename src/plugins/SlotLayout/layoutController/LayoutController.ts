import { StateStore } from 'stream-chat';

import type {
  ChatViewLayoutState,
  ChatViewLayoutViewState,
  CreateLayoutControllerOptions,
  DuplicateEntityPolicy,
  LayoutController as LayoutControllerApi,
  LayoutRuntimeState,
  LayoutSlotBinding,
  OpenOptions,
  OpenResult,
  SlotName,
} from './layoutControllerTypes';

const DEFAULT_LAYOUT_STATE: ChatViewLayoutState = {
  activeView: 'channels',
  layouts: {},
};

/** Build a full per-layout runtime state, defaulting any field left unset.
 * Handy for `initialState` callers that only want to seed a couple of fields. */
export const createLayoutRuntimeState = (
  partial: Partial<LayoutRuntimeState> = {},
): LayoutRuntimeState => ({
  availableSlots: partial.availableSlots ? [...partial.availableSlots] : [],
  hiddenSlots: { ...(partial.hiddenSlots ?? {}) },
  slotBindings: { ...(partial.slotBindings ?? {}) },
  slotForwardHistory: { ...(partial.slotForwardHistory ?? {}) },
  slotHistory: { ...(partial.slotHistory ?? {}) },
  slotLayers: { ...(partial.slotLayers ?? {}) },
  slotMeta: { ...(partial.slotMeta ?? {}) },
  slotNames: partial.slotNames ? [...partial.slotNames] : undefined,
});

const DEFAULT_DUPLICATE_ENTITY_POLICY: DuplicateEntityPolicy = 'allow';

/**
 * Slot binding means:
 *
 * - `slot name` -> `what should be shown in that slot`.
 *
 * Example:
 * - `main` -> `{ kind: 'channel', source: channelA }`
 * - `main-thread` -> `{ kind: 'thread', source: threadX }`
 *
 * In LayoutController:
 * - `payload` is the thing to render in the slot.
 * - `key` (optional) is used to identify duplicates.
 * - changing a binding means \"show different data in this slot now\".
 */
const resolveBindingKey = (binding: LayoutSlotBinding) => binding.key;

const toViewState = (
  state: ChatViewLayoutState,
  view = state.activeView,
): ChatViewLayoutViewState => {
  const layout = state.layouts?.[view];
  return {
    availableSlots: [...(layout?.availableSlots ?? [])],
    hiddenSlots: { ...(layout?.hiddenSlots ?? {}) },
    slotBindings: { ...(layout?.slotBindings ?? {}) },
    slotForwardHistory: { ...(layout?.slotForwardHistory ?? {}) },
    slotHistory: { ...(layout?.slotHistory ?? {}) },
    slotLayers: { ...(layout?.slotLayers ?? {}) },
    slotMeta: { ...(layout?.slotMeta ?? {}) },
    slotNames: layout?.slotNames ? [...layout.slotNames] : undefined,
  };
};

const mergeViewState = (
  state: ChatViewLayoutState,
  nextViewState: ChatViewLayoutViewState,
  view = state.activeView,
): ChatViewLayoutState => ({
  ...state,
  layouts: {
    ...(state.layouts ?? {}),
    [view]: {
      availableSlots: [...nextViewState.availableSlots],
      hiddenSlots: { ...nextViewState.hiddenSlots },
      slotBindings: { ...nextViewState.slotBindings },
      slotForwardHistory: { ...nextViewState.slotForwardHistory },
      slotHistory: { ...nextViewState.slotHistory },
      slotLayers: { ...(nextViewState.slotLayers ?? {}) },
      slotMeta: { ...nextViewState.slotMeta },
      slotNames: nextViewState.slotNames ? [...nextViewState.slotNames] : undefined,
    },
  },
});

const buildInitialState = (
  partialState?: CreateLayoutControllerOptions['initialState'],
): ChatViewLayoutState => {
  const activeView = partialState?.activeView ?? DEFAULT_LAYOUT_STATE.activeView;

  // Flat single-view shorthand: fold top-level runtime fields into the active view's
  // layout when it isn't provided explicitly via `layouts`.
  const {
    availableSlots,
    hiddenSlots,
    slotBindings,
    slotForwardHistory,
    slotHistory,
    slotMeta,
    slotNames,
  } = partialState ?? {};
  const hasFlatViewFields = Boolean(
    availableSlots ||
    hiddenSlots ||
    slotBindings ||
    slotForwardHistory ||
    slotHistory ||
    slotMeta ||
    slotNames,
  );

  const normalized: ChatViewLayoutState = {
    ...DEFAULT_LAYOUT_STATE,
    ...partialState,
    activeView,
    layouts: {
      ...(DEFAULT_LAYOUT_STATE.layouts ?? {}),
      ...(hasFlatViewFields
        ? {
            [activeView]: createLayoutRuntimeState({
              availableSlots,
              hiddenSlots,
              slotBindings,
              slotForwardHistory,
              slotHistory,
              slotMeta,
              slotNames,
            }),
          }
        : {}),
      ...(partialState?.layouts ?? {}),
    },
  };

  const initialViewState = toViewState(normalized, activeView);
  const next = mergeViewState(normalized, initialViewState, activeView);

  if (
    !next.layouts?.[activeView]?.availableSlots?.length &&
    initialViewState.slotNames?.length
  ) {
    const minSlots = Math.max(1, next.minSlots ?? 1);
    const availableSlots = initialViewState.slotNames.slice(
      0,
      Math.min(minSlots, initialViewState.slotNames.length),
    );

    return mergeViewState(
      next,
      {
        ...initialViewState,
        availableSlots,
      },
      activeView,
    );
  }

  return next;
};

const isSameSlotBinding = (
  first: LayoutSlotBinding,
  second: LayoutSlotBinding,
): boolean => {
  const firstKey = resolveBindingKey(first);
  const secondKey = resolveBindingKey(second);

  if (firstKey && secondKey) return firstKey === secondKey;

  return first === second;
};

const findBindingSlot = (
  viewState: ChatViewLayoutViewState,
  binding: LayoutSlotBinding,
): SlotName | undefined => {
  const identityKey = resolveBindingKey(binding);
  if (!identityKey) return;

  return viewState.availableSlots.find((slot) => {
    const boundBinding = viewState.slotBindings[slot];
    if (!boundBinding) return false;
    return resolveBindingKey(boundBinding) === identityKey;
  });
};

const pushSlotHistory = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
  binding: LayoutSlotBinding,
): ChatViewLayoutViewState => {
  const slotHistory = viewState.slotHistory?.[slot] ?? [];
  const previousBinding = slotHistory[slotHistory.length - 1];
  if (previousBinding && isSameSlotBinding(previousBinding, binding)) {
    return viewState;
  }

  return {
    ...viewState,
    slotHistory: {
      ...(viewState.slotHistory ?? {}),
      [slot]: [...slotHistory, binding],
    },
  };
};

const popSlotHistory = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
): { popped?: LayoutSlotBinding; state: ChatViewLayoutViewState } => {
  const slotHistory = viewState.slotHistory?.[slot];
  if (!slotHistory?.length) return { state: viewState };

  const popped = slotHistory[slotHistory.length - 1];
  const nextSlotHistory = { ...(viewState.slotHistory ?? {}) };
  const remainingHistory = slotHistory.slice(0, -1);

  if (remainingHistory.length) {
    nextSlotHistory[slot] = remainingHistory;
  } else {
    delete nextSlotHistory[slot];
  }

  return {
    popped,
    state: {
      ...viewState,
      slotHistory: nextSlotHistory,
    },
  };
};

const pushSlotForwardHistory = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
  binding: LayoutSlotBinding,
): ChatViewLayoutViewState => {
  const slotForwardHistory = viewState.slotForwardHistory?.[slot] ?? [];
  const previousBinding = slotForwardHistory[slotForwardHistory.length - 1];
  if (previousBinding && isSameSlotBinding(previousBinding, binding)) {
    return viewState;
  }

  return {
    ...viewState,
    slotForwardHistory: {
      ...(viewState.slotForwardHistory ?? {}),
      [slot]: [...slotForwardHistory, binding],
    },
  };
};

const popSlotForwardHistory = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
): { popped?: LayoutSlotBinding; state: ChatViewLayoutViewState } => {
  const slotForwardHistory = viewState.slotForwardHistory?.[slot];
  if (!slotForwardHistory?.length) return { state: viewState };

  const popped = slotForwardHistory[slotForwardHistory.length - 1];
  const nextSlotForwardHistory = { ...(viewState.slotForwardHistory ?? {}) };
  const remainingHistory = slotForwardHistory.slice(0, -1);

  if (remainingHistory.length) {
    nextSlotForwardHistory[slot] = remainingHistory;
  } else {
    delete nextSlotForwardHistory[slot];
  }

  return {
    popped,
    state: {
      ...viewState,
      slotForwardHistory: nextSlotForwardHistory,
    },
  };
};

const clearSlotForwardHistory = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
): ChatViewLayoutViewState => {
  if (!viewState.slotForwardHistory?.[slot]) return viewState;

  const nextSlotForwardHistory = { ...(viewState.slotForwardHistory ?? {}) };
  delete nextSlotForwardHistory[slot];

  return {
    ...viewState,
    slotForwardHistory: nextSlotForwardHistory,
  };
};

const upsertSlotBinding = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
  binding: LayoutSlotBinding,
): ChatViewLayoutViewState => {
  const nextSlotBindings: ChatViewLayoutViewState['slotBindings'] = {
    ...viewState.slotBindings,
    [slot]: binding,
  };

  const wasOccupied = !!viewState.slotBindings[slot];
  const hasOccupiedAt = typeof viewState.slotMeta[slot]?.occupiedAt === 'number';
  const shouldSetOccupiedAt = !wasOccupied || !hasOccupiedAt;

  const nextSlotMeta = shouldSetOccupiedAt
    ? {
        ...viewState.slotMeta,
        [slot]: {
          occupiedAt: Date.now(),
        },
      }
    : viewState.slotMeta;

  return {
    ...viewState,
    slotBindings: nextSlotBindings,
    slotMeta: nextSlotMeta,
  };
};

const clearSlotBinding = (
  viewState: ChatViewLayoutViewState,
  slot: SlotName,
): ChatViewLayoutViewState => {
  if (
    !viewState.slotBindings[slot] &&
    !viewState.slotMeta[slot] &&
    !viewState.slotHistory?.[slot] &&
    !viewState.slotForwardHistory?.[slot] &&
    !viewState.slotLayers?.[slot]
  ) {
    return viewState;
  }

  const nextSlotBindings = { ...viewState.slotBindings };
  delete nextSlotBindings[slot];

  const nextSlotMeta = { ...viewState.slotMeta };
  delete nextSlotMeta[slot];

  const nextSlotHistory = { ...(viewState.slotHistory ?? {}) };
  delete nextSlotHistory[slot];

  const nextSlotForwardHistory = { ...(viewState.slotForwardHistory ?? {}) };
  delete nextSlotForwardHistory[slot];

  const nextSlotLayers = { ...(viewState.slotLayers ?? {}) };
  delete nextSlotLayers[slot];

  return {
    ...viewState,
    slotBindings: nextSlotBindings,
    slotForwardHistory: nextSlotForwardHistory,
    slotHistory: nextSlotHistory,
    slotLayers: nextSlotLayers,
    slotMeta: nextSlotMeta,
  };
};

// step 2 — the single slot resolver lives in the navigation layer (ChatViewNavigationContext).
// openInLayout is pure mechanism: it accepts an already-resolved, available target slot (an
// occupied slot is allowed — that is a replace) and otherwise rejects. Callers own resolution.
const resolveOpenTargetSlot = (
  activeViewState: ChatViewLayoutViewState,
  options: OpenOptions | undefined,
): SlotName | undefined => {
  const requestedSlot = options?.targetSlot;
  if (!requestedSlot) return undefined;
  return activeViewState.availableSlots.includes(requestedSlot)
    ? requestedSlot
    : undefined;
};

export class LayoutController implements LayoutControllerApi {
  private readonly duplicateEntityPolicy: DuplicateEntityPolicy;
  private readonly resolveDuplicateEntity?: CreateLayoutControllerOptions['resolveDuplicateEntity'];
  state: StateStore<ChatViewLayoutState>;

  constructor(options: CreateLayoutControllerOptions = {}) {
    const {
      duplicateEntityPolicy = DEFAULT_DUPLICATE_ENTITY_POLICY,
      initialState,
      resolveDuplicateEntity,
      state = new StateStore<ChatViewLayoutState>(buildInitialState(initialState)),
    } = options;

    this.duplicateEntityPolicy = duplicateEntityPolicy;
    this.resolveDuplicateEntity = resolveDuplicateEntity;
    this.state = state;
  }

  setActiveView: LayoutControllerApi['setActiveView'] = (next) => {
    this.state.next((current) => ({ ...current, activeView: next }));
  };

  openView: LayoutControllerApi['openView'] = (view, options) => {
    void options;
    this.state.next((current) => ({ ...current, activeView: view }));
  };

  setAvailableSlots: LayoutControllerApi['setAvailableSlots'] = (slots) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      return mergeViewState(current, {
        ...activeViewState,
        availableSlots: [...slots],
      });
    });
  };

  setSlotNames: LayoutControllerApi['setSlotNames'] = (slots) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      return mergeViewState(current, {
        ...activeViewState,
        slotNames: slots?.length ? [...slots] : undefined,
      });
    });
  };

  hide: LayoutControllerApi['hide'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      return mergeViewState(current, {
        ...activeViewState,
        hiddenSlots: {
          ...activeViewState.hiddenSlots,
          [slot]: true,
        },
      });
    });
  };

  unhide: LayoutControllerApi['unhide'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      return mergeViewState(current, {
        ...activeViewState,
        hiddenSlots: {
          ...activeViewState.hiddenSlots,
          [slot]: false,
        },
      });
    });
  };

  // step 4 — bind/release are the mechanism primitives. `bind` places a binding into a slot
  // (an occupied slot is replaced); `release` frees a slot. Higher-level open/close in the
  // navigation layer are built on these; history navigation is goBack/goForward, kept separate.
  bind: LayoutControllerApi['bind'] = (slot, binding) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const nextViewState = clearSlotForwardHistory(
        upsertSlotBinding(activeViewState, slot, binding),
        slot,
      );

      return mergeViewState(current, nextViewState);
    });
  };

  release: LayoutControllerApi['release'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      return mergeViewState(current, clearSlotBinding(activeViewState, slot));
    });
  };

  // Layers stack *above* a slot's base binding (see `slotLayers`). Push/pop keep every layer
  // (and the base beneath) mounted; only the topmost is shown by the renderer, so popping a
  // layer reveals what's underneath at its exact preserved state.
  pushLayer: LayoutControllerApi['pushLayer'] = (slot, binding) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const slotLayers = activeViewState.slotLayers?.[slot] ?? [];
      return mergeViewState(current, {
        ...activeViewState,
        slotLayers: {
          ...(activeViewState.slotLayers ?? {}),
          [slot]: [...slotLayers, binding],
        },
      });
    });
  };

  popLayer: LayoutControllerApi['popLayer'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const slotLayers = activeViewState.slotLayers?.[slot];
      if (!slotLayers?.length) return current;

      const nextSlotLayers = { ...(activeViewState.slotLayers ?? {}) };
      const remaining = slotLayers.slice(0, -1);
      if (remaining.length) {
        nextSlotLayers[slot] = remaining;
      } else {
        delete nextSlotLayers[slot];
      }

      return mergeViewState(current, {
        ...activeViewState,
        slotLayers: nextSlotLayers,
      });
    });
  };

  goBack: LayoutControllerApi['goBack'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const { popped, state: nextState } = popSlotHistory(activeViewState, slot);
      if (!popped) return mergeViewState(current, nextState);

      const currentBinding = nextState.slotBindings[slot];
      const withForward = currentBinding
        ? pushSlotForwardHistory(nextState, slot, currentBinding)
        : nextState;

      return mergeViewState(current, upsertSlotBinding(withForward, slot, popped));
    });
  };

  goForward: LayoutControllerApi['goForward'] = (slot) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const { popped, state: nextState } = popSlotForwardHistory(activeViewState, slot);
      if (!popped) return mergeViewState(current, nextState);

      const currentBinding = nextState.slotBindings[slot];
      const withBack = currentBinding
        ? pushSlotHistory(nextState, slot, currentBinding)
        : nextState;

      return mergeViewState(current, upsertSlotBinding(withBack, slot, popped));
    });
  };

  openInLayout: LayoutControllerApi['openInLayout'] = (binding, openOptions) => {
    const current = this.state.getLatestValue();
    const activeViewState = toViewState(current);
    const targetSlot = resolveOpenTargetSlot(activeViewState, openOptions);

    if (!targetSlot) {
      return {
        reason: 'no-available-slot',
        status: 'rejected',
      } satisfies OpenResult;
    }

    const existingBindingSlot = findBindingSlot(activeViewState, binding);

    if (existingBindingSlot) {
      const duplicatePolicy =
        this.resolveDuplicateEntity?.({
          activeViewState,
          binding,
          existingSlot: existingBindingSlot,
          requestedSlot: openOptions?.targetSlot,
          state: current,
        }) ?? this.duplicateEntityPolicy;

      if (duplicatePolicy === 'reject') {
        return {
          reason: 'duplicate-binding',
          status: 'rejected',
        } satisfies OpenResult;
      }

      if (duplicatePolicy === 'move' && existingBindingSlot !== targetSlot) {
        this.state.next((nextState) =>
          mergeViewState(
            nextState,
            clearSlotBinding(toViewState(nextState), existingBindingSlot),
          ),
        );
      }
    }

    const replacedBinding = toViewState(this.state.getLatestValue()).slotBindings[
      targetSlot
    ];

    this.state.next((nextState) => {
      const currentViewState = toViewState(nextState);
      const currentSlotBinding = currentViewState.slotBindings[targetSlot];
      const withHistory =
        currentSlotBinding && !isSameSlotBinding(currentSlotBinding, binding)
          ? pushSlotHistory(currentViewState, targetSlot, currentSlotBinding)
          : currentViewState;
      const nextViewState = clearSlotForwardHistory(
        upsertSlotBinding(withHistory, targetSlot, binding),
        targetSlot,
      );

      return mergeViewState(nextState, nextViewState);
    });

    if (replacedBinding && replacedBinding !== binding) {
      return {
        replaced: replacedBinding,
        slot: targetSlot,
        status: 'replaced',
      } satisfies OpenResult;
    }

    return {
      slot: targetSlot,
      status: 'opened',
    } satisfies OpenResult;
  };
}
