import { StateStore } from 'stream-chat';

import type {
  ChatViewLayoutState,
  ChatViewLayoutViewState,
  CreateLayoutControllerOptions,
  DuplicateEntityPolicy,
  LayoutController as LayoutControllerApi,
  LayoutSlotBinding,
  OpenOptions,
  OpenResult,
  SlotName,
} from './layoutControllerTypes';

const DEFAULT_LAYOUT_STATE: ChatViewLayoutState = {
  activeView: 'channels',
  availableSlotsByView: {},
  hiddenSlotsByView: {},
  listSlotByView: {},
  slotBindingsByView: {},
  slotForwardHistoryByView: {},
  slotHistoryByView: {},
  slotMetaByView: {},
  slotNamesByView: {},
};

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
): ChatViewLayoutViewState => ({
  availableSlots: [...(state.availableSlotsByView?.[view] ?? [])],
  hiddenSlots: { ...(state.hiddenSlotsByView?.[view] ?? {}) },
  slotBindings: { ...(state.slotBindingsByView?.[view] ?? {}) },
  slotForwardHistory: { ...(state.slotForwardHistoryByView?.[view] ?? {}) },
  slotHistory: { ...(state.slotHistoryByView?.[view] ?? {}) },
  slotMeta: { ...(state.slotMetaByView?.[view] ?? {}) },
  slotNames: state.slotNamesByView?.[view]
    ? [...(state.slotNamesByView?.[view] ?? [])]
    : undefined,
});

const mergeViewState = (
  state: ChatViewLayoutState,
  nextViewState: ChatViewLayoutViewState,
  view = state.activeView,
): ChatViewLayoutState => ({
  ...state,
  availableSlotsByView: {
    ...(state.availableSlotsByView ?? {}),
    [view]: [...nextViewState.availableSlots],
  },
  hiddenSlotsByView: {
    ...(state.hiddenSlotsByView ?? {}),
    [view]: { ...nextViewState.hiddenSlots },
  },
  slotBindingsByView: {
    ...(state.slotBindingsByView ?? {}),
    [view]: { ...nextViewState.slotBindings },
  },
  slotForwardHistoryByView: {
    ...(state.slotForwardHistoryByView ?? {}),
    [view]: { ...nextViewState.slotForwardHistory },
  },
  slotHistoryByView: {
    ...(state.slotHistoryByView ?? {}),
    [view]: { ...nextViewState.slotHistory },
  },
  slotMetaByView: {
    ...(state.slotMetaByView ?? {}),
    [view]: { ...nextViewState.slotMeta },
  },
  slotNamesByView: {
    ...(state.slotNamesByView ?? {}),
    [view]: nextViewState.slotNames ? [...nextViewState.slotNames] : undefined,
  },
});

const buildInitialState = (
  partialState?: CreateLayoutControllerOptions['initialState'],
): ChatViewLayoutState => {
  const activeView = partialState?.activeView ?? DEFAULT_LAYOUT_STATE.activeView;

  const normalized: ChatViewLayoutState = {
    ...DEFAULT_LAYOUT_STATE,
    ...partialState,
    activeView,
    availableSlotsByView: {
      ...DEFAULT_LAYOUT_STATE.availableSlotsByView,
      ...(partialState?.availableSlotsByView ?? {}),
    },
    hiddenSlotsByView: {
      ...DEFAULT_LAYOUT_STATE.hiddenSlotsByView,
      ...(partialState?.hiddenSlotsByView ?? {}),
    },
    listSlotByView: {
      ...DEFAULT_LAYOUT_STATE.listSlotByView,
      ...(partialState?.listSlotByView ?? {}),
    },
    slotBindingsByView: {
      ...DEFAULT_LAYOUT_STATE.slotBindingsByView,
      ...(partialState?.slotBindingsByView ?? {}),
    },
    slotForwardHistoryByView: {
      ...DEFAULT_LAYOUT_STATE.slotForwardHistoryByView,
      ...(partialState?.slotForwardHistoryByView ?? {}),
    },
    slotHistoryByView: {
      ...DEFAULT_LAYOUT_STATE.slotHistoryByView,
      ...(partialState?.slotHistoryByView ?? {}),
    },
    slotMetaByView: {
      ...DEFAULT_LAYOUT_STATE.slotMetaByView,
      ...(partialState?.slotMetaByView ?? {}),
    },
    slotNamesByView: {
      ...DEFAULT_LAYOUT_STATE.slotNamesByView,
      ...(partialState?.slotNamesByView ?? {}),
    },
  };

  const initialViewState = toViewState(normalized, activeView);
  const next = mergeViewState(normalized, initialViewState, activeView);

  if (
    !next.availableSlotsByView?.[activeView]?.length &&
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
    !viewState.slotForwardHistory?.[slot]
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

  return {
    ...viewState,
    slotBindings: nextSlotBindings,
    slotForwardHistory: nextSlotForwardHistory,
    slotHistory: nextSlotHistory,
    slotMeta: nextSlotMeta,
  };
};

const resolveOpenTargetSlot = (
  state: ChatViewLayoutState,
  activeViewState: ChatViewLayoutViewState,
  binding: LayoutSlotBinding,
  options: OpenOptions | undefined,
  resolveTargetSlot: CreateLayoutControllerOptions['resolveTargetSlot'],
): SlotName | undefined => {
  const requestedSlot = options?.targetSlot;
  if (requestedSlot) {
    if (!activeViewState.availableSlots.includes(requestedSlot)) return;
    return requestedSlot;
  }

  const firstFreeSlot = activeViewState.availableSlots.find(
    (slot) => !activeViewState.slotBindings[slot],
  );
  if (firstFreeSlot) return firstFreeSlot;

  const resolvedSlot = resolveTargetSlot?.({
    activeViewState,
    binding,
    requestedSlot,
    state,
  });

  if (!resolvedSlot) return;
  if (!activeViewState.availableSlots.includes(resolvedSlot)) return;

  return resolvedSlot;
};

export class LayoutController implements LayoutControllerApi {
  private readonly duplicateEntityPolicy: DuplicateEntityPolicy;
  private readonly resolveDuplicateEntity?: CreateLayoutControllerOptions['resolveDuplicateEntity'];
  private readonly resolveTargetSlot?: CreateLayoutControllerOptions['resolveTargetSlot'];
  state: StateStore<ChatViewLayoutState>;

  constructor(options: CreateLayoutControllerOptions = {}) {
    const {
      duplicateEntityPolicy = DEFAULT_DUPLICATE_ENTITY_POLICY,
      initialState,
      resolveDuplicateEntity,
      resolveTargetSlot,
      state = new StateStore<ChatViewLayoutState>(buildInitialState(initialState)),
    } = options;

    this.duplicateEntityPolicy = duplicateEntityPolicy;
    this.resolveDuplicateEntity = resolveDuplicateEntity;
    this.resolveTargetSlot = resolveTargetSlot;
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

  setSlotBinding: LayoutControllerApi['setSlotBinding'] = (slot, binding) => {
    this.state.next((current) => {
      const activeViewState = toViewState(current);
      const nextViewState = !binding
        ? clearSlotBinding(activeViewState, slot)
        : clearSlotForwardHistory(
            upsertSlotBinding(activeViewState, slot, binding),
            slot,
          );

      const nextListSlotByView = { ...(current.listSlotByView ?? {}) };
      if (!binding && nextListSlotByView[current.activeView] === slot) {
        delete nextListSlotByView[current.activeView];
      }

      return {
        ...mergeViewState(current, nextViewState),
        listSlotByView: nextListSlotByView,
      };
    });
  };

  clear: LayoutControllerApi['clear'] = (slot) => {
    this.setSlotBinding(slot, undefined);
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
    const targetSlot = resolveOpenTargetSlot(
      current,
      activeViewState,
      binding,
      openOptions,
      this.resolveTargetSlot,
    );

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
