import { StateStore } from 'stream-chat';
import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';

import type {
  ChatViewLayoutState,
  CreateLayoutControllerOptions,
  DuplicateEntityPolicy,
  LayoutController,
  LayoutEntityBinding,
  LayoutSlot,
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

const DEFAULT_DUPLICATE_ENTITY_POLICY: DuplicateEntityPolicy = 'allow';

const resolveEntityKey = (entity: LayoutEntityBinding) =>
  entity.key ? `${entity.kind}:${entity.key}` : undefined;

const findEntitySlot = (
  state: ChatViewLayoutState,
  entity: LayoutEntityBinding,
): LayoutSlot | undefined => {
  const identityKey = resolveEntityKey(entity);
  if (!identityKey) return;

  return state.visibleSlots.find((slot) => {
    const boundEntity = state.slotBindings[slot];
    if (!boundEntity) return false;
    return resolveEntityKey(boundEntity) === identityKey;
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

const isSameEntityBinding = (
  first: LayoutEntityBinding,
  second: LayoutEntityBinding,
): boolean => {
  const firstKey = resolveEntityKey(first);
  const secondKey = resolveEntityKey(second);

  if (firstKey && secondKey) return firstKey === secondKey;

  return first === second;
};

const pushSlotHistory = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
  entity: LayoutEntityBinding,
): ChatViewLayoutState => {
  const slotHistory = current.slotHistory?.[slot] ?? [];

  return {
    ...current,
    slotHistory: {
      ...(current.slotHistory ?? {}),
      [slot]: [...slotHistory, entity],
    },
  };
};

const popSlotHistory = (
  current: ChatViewLayoutState,
  slot: LayoutSlot,
): { popped?: LayoutEntityBinding; state: ChatViewLayoutState } => {
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
  entity: LayoutEntityBinding,
): ChatViewLayoutState => {
  const nextSlotBindings: ChatViewLayoutState['slotBindings'] = {
    ...current.slotBindings,
    [slot]: entity,
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
  entity: LayoutEntityBinding,
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
    entity,
    requestedSlot,
    state,
  });

  if (!resolvedSlot) return;
  if (!state.visibleSlots.includes(resolvedSlot)) return;

  return resolvedSlot;
};

const getChannelEntityKey = (channel: StreamChannel) => channel.cid ?? undefined;
const getThreadEntityKey = (thread: StreamThread) => thread.id ?? undefined;
const getMemberListEntityKey = (channel: StreamChannel) =>
  channel.cid ? `member-list:${channel.cid}` : undefined;
const getPinnedMessagesListEntityKey = (channel: StreamChannel) =>
  channel.cid ? `pinned-messages:${channel.cid}` : undefined;
const getUserListEntityKey = ({ query }: { query: string }) => `user-list:${query}`;

export const createLayoutController = (
  options: CreateLayoutControllerOptions = {},
): LayoutController => {
  const {
    duplicateEntityPolicy = DEFAULT_DUPLICATE_ENTITY_POLICY,
    initialState,
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

  const bind: LayoutController['bind'] = (slot, entity) => {
    if (!entity) {
      state.next((current) => clearSlotBinding(current, slot));
      return;
    }

    state.next((current) => upsertSlotBinding(current, slot, entity));
  };

  const clear: LayoutController['clear'] = (slot) => {
    state.next((current) => clearSlotBinding(current, slot));
  };

  const pushParent: LayoutController['pushParent'] = (slot, entity) => {
    state.next((current) => pushSlotHistory(current, slot, entity));
  };

  const popParent: LayoutController['popParent'] = (slot) => {
    let popped: LayoutEntityBinding | undefined;

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

  const open: LayoutController['open'] = (entity, openOptions) => {
    const current = state.getLatestValue();
    const targetSlot = resolveOpenTargetSlot(
      current,
      entity,
      openOptions,
      resolveTargetSlot,
    );

    if (!targetSlot) {
      return {
        reason: 'no-available-slot',
        status: 'rejected',
      } satisfies OpenResult;
    }

    const existingEntitySlot = findEntitySlot(current, entity);

    if (existingEntitySlot) {
      const duplicatePolicy =
        resolveDuplicateEntity?.({
          activeSlot: current.activeSlot,
          entity,
          existingSlot: existingEntitySlot,
          requestedSlot: openOptions?.targetSlot,
          state: current,
        }) ?? duplicateEntityPolicy;

      if (duplicatePolicy === 'reject') {
        return {
          reason: 'duplicate-entity',
          status: 'rejected',
        } satisfies OpenResult;
      }

      if (duplicatePolicy === 'move' && existingEntitySlot !== targetSlot) {
        state.next((nextState) => clearSlotBinding(nextState, existingEntitySlot));
      }
    }

    const replacedEntity = state.getLatestValue().slotBindings[targetSlot];
    const shouldActivateSlot = openOptions?.activate ?? true;

    state.next((nextState) => {
      const currentSlotBinding = nextState.slotBindings[targetSlot];
      const withHistory =
        currentSlotBinding && !isSameEntityBinding(currentSlotBinding, entity)
          ? pushSlotHistory(nextState, targetSlot, currentSlotBinding)
          : nextState;
      const next = upsertSlotBinding(withHistory, targetSlot, entity);

      if (!shouldActivateSlot) return next;

      return {
        ...next,
        activeSlot: targetSlot,
      };
    });

    if (replacedEntity && replacedEntity !== entity) {
      return {
        replaced: replacedEntity,
        slot: targetSlot,
        status: 'replaced',
      } satisfies OpenResult;
    }

    return {
      slot: targetSlot,
      status: 'opened',
    } satisfies OpenResult;
  };

  const openChannel: LayoutController['openChannel'] = (channel, openOptions) =>
    open(
      {
        key: getChannelEntityKey(channel),
        kind: 'channel',
        source: channel,
      },
      openOptions,
    );

  const openThread: LayoutController['openThread'] = (thread, openOptions) =>
    open(
      {
        key: getThreadEntityKey(thread),
        kind: 'thread',
        source: thread,
      },
      openOptions,
    );

  const openMemberList: LayoutController['openMemberList'] = (channel, openOptions) =>
    open(
      {
        key: getMemberListEntityKey(channel),
        kind: 'memberList',
        source: channel,
      },
      openOptions,
    );

  const openUserList: LayoutController['openUserList'] = (source, openOptions) =>
    open(
      {
        key: getUserListEntityKey(source),
        kind: 'userList',
        source,
      },
      openOptions,
    );

  const openPinnedMessagesList: LayoutController['openPinnedMessagesList'] = (
    channel,
    openOptions,
  ) =>
    open(
      {
        key: getPinnedMessagesListEntityKey(channel),
        kind: 'pinnedMessagesList',
        source: channel,
      },
      openOptions,
    );

  return {
    bind,
    clear,
    close,
    open,
    openChannel,
    openMemberList,
    openPinnedMessagesList,
    openThread,
    openUserList,
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
