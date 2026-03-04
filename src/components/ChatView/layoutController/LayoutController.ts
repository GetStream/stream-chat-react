import { StateStore } from 'stream-chat';

import type {
  ChatViewLayoutState,
  CreateLayoutControllerOptions,
  DuplicateSlotPolicy,
  LayoutController,
  LayoutSlot,
  LayoutSlotBinding,
  OpenOptions,
  OpenResult,
} from './layoutControllerTypes';

const DEFAULT_LAYOUT_STATE: ChatViewLayoutState = {
  activeSlot: undefined,
  activeView: 'channels',
  entityListPaneOpen: true,
  hiddenSlots: {},
  mode: 'default',
  slotBindings: {},
  slotHistory: {},
  slotMeta: {},
  visibleSlots: [],
};

const DEFAULT_DUPLICATE_SLOT_POLICY: DuplicateSlotPolicy = 'allow';

const resolveBindingKey = (binding: LayoutSlotBinding) => binding.key;

const findBindingSlot = (
  state: ChatViewLayoutState,
  binding: LayoutSlotBinding,
): LayoutSlot | undefined => {
  const identityKey = resolveBindingKey(binding);
  if (!identityKey) return;

  return state.visibleSlots.find((slot) => {
    const boundBinding = state.slotBindings[slot];
    if (!boundBinding) return false;
    return resolveBindingKey(boundBinding) === identityKey;
  });
};

const buildInitialState = (
  partialState?: Partial<ChatViewLayoutState>,
): ChatViewLayoutState => ({
  ...DEFAULT_LAYOUT_STATE,
  ...partialState,
  hiddenSlots: {
    ...DEFAULT_LAYOUT_STATE.hiddenSlots,
    ...(partialState?.hiddenSlots ?? {}),
  },
  slotBindings: {
    ...DEFAULT_LAYOUT_STATE.slotBindings,
    ...(partialState?.slotBindings ?? {}),
  },
  slotHistory: {
    ...DEFAULT_LAYOUT_STATE.slotHistory,
    ...(partialState?.slotHistory ?? {}),
  },
  slotMeta: {
    ...DEFAULT_LAYOUT_STATE.slotMeta,
    ...(partialState?.slotMeta ?? {}),
  },
  visibleSlots: partialState?.visibleSlots ?? DEFAULT_LAYOUT_STATE.visibleSlots,
});

const isSameSlotBinding = (
  first: LayoutSlotBinding,
  second: LayoutSlotBinding,
): boolean => {
  const firstKey = resolveBindingKey(first);
  const secondKey = resolveBindingKey(second);

  if (firstKey && secondKey) return firstKey === secondKey;

  return first === second;
};

const pushSlotHistory = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
  binding: LayoutSlotBinding,
): ChatViewLayoutState => {
  const slotHistory = current.slotHistory?.[slot] ?? [];

  return {
    ...current,
    slotHistory: {
      ...(current.slotHistory ?? {}),
      [slot]: [...slotHistory, binding],
    },
  };
};

const popSlotHistory = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
): { popped?: LayoutSlotBinding; state: ChatViewLayoutState } => {
  const slotHistory = current.slotHistory?.[slot];
  if (!slotHistory?.length) return { state: current };

  const popped = slotHistory[slotHistory.length - 1];
  const nextSlotHistory = { ...(current.slotHistory ?? {}) };
  const remainingHistory = slotHistory.slice(0, -1);

  if (remainingHistory.length) {
    nextSlotHistory[slot] = remainingHistory;
  } else {
    delete nextSlotHistory[slot];
  }

  return {
    popped,
    state: {
      ...current,
      slotHistory: nextSlotHistory,
    },
  };
};

const upsertSlotBinding = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
  binding: LayoutSlotBinding,
): ChatViewLayoutState => {
  const nextSlotBindings: ChatViewLayoutState['slotBindings'] = {
    ...current.slotBindings,
    [slot]: binding,
  };

  const wasOccupied = !!current.slotBindings[slot];
  const hasOccupiedAt = typeof current.slotMeta[slot]?.occupiedAt === 'number';
  const shouldSetOccupiedAt = !wasOccupied || !hasOccupiedAt;

  const nextSlotMeta = shouldSetOccupiedAt
    ? {
        ...current.slotMeta,
        [slot]: {
          occupiedAt: Date.now(),
        },
      }
    : current.slotMeta;

  return {
    ...current,
    slotBindings: nextSlotBindings,
    slotMeta: nextSlotMeta,
  };
};

const clearSlotBinding = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
): ChatViewLayoutState => {
  if (
    !current.slotBindings[slot] &&
    !current.slotMeta[slot] &&
    !current.slotHistory?.[slot]
  ) {
    return current;
  }

  const nextSlotBindings = { ...current.slotBindings };
  delete nextSlotBindings[slot];

  const nextSlotMeta = { ...current.slotMeta };
  delete nextSlotMeta[slot];

  const nextSlotHistory = { ...(current.slotHistory ?? {}) };
  delete nextSlotHistory[slot];

  const nextActiveSlot = current.activeSlot === slot ? undefined : current.activeSlot;

  return {
    ...current,
    activeSlot: nextActiveSlot,
    slotBindings: nextSlotBindings,
    slotHistory: nextSlotHistory,
    slotMeta: nextSlotMeta,
  };
};

const resolveOpenTargetSlot = (
  state: ChatViewLayoutState,
  binding: LayoutSlotBinding,
  options: OpenOptions | undefined,
  resolveTargetSlot: CreateLayoutControllerOptions['resolveTargetSlot'],
): LayoutSlot | undefined => {
  const requestedSlot = options?.targetSlot;
  if (requestedSlot) {
    if (!state.visibleSlots.includes(requestedSlot)) return;
    return requestedSlot;
  }

  const firstFreeSlot = state.visibleSlots.find((slot) => !state.slotBindings[slot]);
  if (firstFreeSlot) return firstFreeSlot;

  const resolvedSlot = resolveTargetSlot?.({
    activeSlot: state.activeSlot,
    binding,
    requestedSlot,
    state,
  });

  if (!resolvedSlot) return;
  if (!state.visibleSlots.includes(resolvedSlot)) return;

  return resolvedSlot;
};
export const createLayoutController = (
  options: CreateLayoutControllerOptions = {},
): LayoutController => {
  const {
    duplicateEntityPolicy,
    duplicateSlotPolicy = duplicateEntityPolicy ?? DEFAULT_DUPLICATE_SLOT_POLICY,
    initialState,
    resolveDuplicateSlot = options.resolveDuplicateEntity,
    resolveDuplicateEntity,
    resolveTargetSlot,
    state = new StateStore<ChatViewLayoutState>(buildInitialState(initialState)),
  } = options;

  const setActiveView: LayoutController['setActiveView'] = (next) => {
    state.partialNext({ activeView: next });
  };

  const openView: LayoutController['openView'] = (view, options) => {
    const targetSlot = options?.slot;
    const shouldActivateSlot = options?.activateSlot ?? true;

    state.next((current) => ({
      ...current,
      activeSlot:
        shouldActivateSlot && targetSlot && current.visibleSlots.includes(targetSlot)
          ? targetSlot
          : current.activeSlot,
      activeView: view,
    }));
  };

  const setMode: LayoutController['setMode'] = (next) => {
    state.partialNext({ mode: next });
  };

  const setEntityListPaneOpen: LayoutController['setEntityListPaneOpen'] = (next) => {
    state.partialNext({ entityListPaneOpen: next });
  };

  const toggleEntityListPane: LayoutController['toggleEntityListPane'] = () => {
    state.next((current) => ({
      ...current,
      entityListPaneOpen: !current.entityListPaneOpen,
    }));
  };

  const setSlotHidden: LayoutController['setSlotHidden'] = (slot, hidden) => {
    state.next((current) => ({
      ...current,
      hiddenSlots: {
        ...(current.hiddenSlots ?? {}),
        [slot]: hidden,
      },
    }));
  };

  const bind: LayoutController['bind'] = (slot, binding) => {
    if (!binding) {
      state.next((current) => clearSlotBinding(current, slot));
      return;
    }

    state.next((current) => upsertSlotBinding(current, slot, binding));
  };

  const clear: LayoutController['clear'] = (slot) => {
    state.next((current) => clearSlotBinding(current, slot));
  };

  const pushParent: LayoutController['pushParent'] = (slot, binding) => {
    state.next((current) => pushSlotHistory(current, slot, binding));
  };

  const popParent: LayoutController['popParent'] = (slot) => {
    let popped: LayoutSlotBinding | undefined;

    state.next((current) => {
      const result = popSlotHistory(current, slot);
      popped = result.popped;
      return result.state;
    });

    return popped;
  };

  const close: LayoutController['close'] = (slot, options) => {
    const restoreFromHistory = options?.restoreFromHistory ?? true;
    if (!restoreFromHistory) {
      clear(slot);
      return;
    }

    state.next((current) => {
      const { popped, state: nextState } = popSlotHistory(current, slot);
      if (!popped) return clearSlotBinding(nextState, slot);

      const restored = upsertSlotBinding(nextState, slot, popped);

      return {
        ...restored,
        activeSlot: slot,
      };
    });
  };

  const open: LayoutController['open'] = (binding, openOptions) => {
    const current = state.getLatestValue();
    const targetSlot = resolveOpenTargetSlot(
      current,
      binding,
      openOptions,
      resolveTargetSlot,
    );

    if (!targetSlot) {
      return {
        reason: 'no-available-slot',
        status: 'rejected',
      } satisfies OpenResult;
    }

    const existingBindingSlot = findBindingSlot(current, binding);

    if (existingBindingSlot) {
      const duplicatePolicy =
        resolveDuplicateSlot?.({
          activeSlot: current.activeSlot,
          binding,
          existingSlot: existingBindingSlot,
          requestedSlot: openOptions?.targetSlot,
          state: current,
        }) ??
        resolveDuplicateEntity?.({
          activeSlot: current.activeSlot,
          binding,
          existingSlot: existingBindingSlot,
          requestedSlot: openOptions?.targetSlot,
          state: current,
        }) ??
        duplicateSlotPolicy;

      if (duplicatePolicy === 'reject') {
        return {
          reason: 'duplicate-binding',
          status: 'rejected',
        } satisfies OpenResult;
      }

      if (duplicatePolicy === 'move' && existingBindingSlot !== targetSlot) {
        state.next((nextState) => clearSlotBinding(nextState, existingBindingSlot));
      }
    }

    const replacedBinding = state.getLatestValue().slotBindings[targetSlot];
    const shouldActivateSlot = openOptions?.activate ?? true;

    state.next((nextState) => {
      const currentSlotBinding = nextState.slotBindings[targetSlot];
      const withHistory =
        currentSlotBinding && !isSameSlotBinding(currentSlotBinding, binding)
          ? pushSlotHistory(nextState, targetSlot, currentSlotBinding)
          : nextState;
      const next = upsertSlotBinding(withHistory, targetSlot, binding);

      if (!shouldActivateSlot) return next;

      return {
        ...next,
        activeSlot: targetSlot,
      };
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

  return {
    bind,
    clear,
    close,
    open,
    openView,
    popParent,
    pushParent,
    setActiveView,
    setEntityListPaneOpen,
    setMode,
    setSlotHidden,
    state,
    toggleEntityListPane,
  };
};
