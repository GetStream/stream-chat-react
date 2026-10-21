import React, { createContext, useContext, useMemo } from 'react';

import { useStateStore } from '../../store';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from './ChatView';
import {
  isPersistentSlotKind,
  resolveSlotKindView,
  useSlotRegistry,
} from './slotRegistry';

import type { PropsWithChildren } from 'react';
import type {
  LocalMessage,
  Channel as StreamChannel,
  StreamChat,
  Thread as StreamThread,
} from 'stream-chat';
import type {
  ChatView,
  ChatViewEntityBinding,
  ResolveViewActionTargetSlotArgs,
} from './ChatView';
import { getLayoutViewState, useLayoutViewState } from './hooks/useLayoutViewState';
import type {
  ChatViewLayoutState,
  ChatViewLayoutViewState,
  LayoutSlotBinding,
  OpenResult,
  SlotName,
} from './layoutController/layoutControllerTypes';

type ViewSlotRuntime = {
  activeViewState: ChatViewLayoutViewState;
  availableSlots: SlotName[];
  orderedSlots: SlotName[];
  slotBindings: Record<SlotName, LayoutSlotBinding | undefined>;
  slotLayers: Record<SlotName, LayoutSlotBinding[] | undefined>;
};

// Picks the slot for a binding: the requested slot when available, one already holding the same
// kind, the first free non-persistent slot, the first free slot, then the last non-persistent slot.
// That last fallback skips persistent (list) slots, so when only persistent slots remain it returns
// undefined and `open` rejects instead of evicting a list.
const resolveDefaultTargetSlot = ({
  additive,
  isPersistentSlot,
  kind,
  requestedSlot,
  runtime,
}: {
  additive?: boolean;
  isPersistentSlot: (slot: SlotName) => boolean;
  kind: ChatViewEntityBinding['kind'];
  requestedSlot?: SlotName;
  runtime: ViewSlotRuntime;
}): SlotName | undefined => {
  if (requestedSlot && runtime.availableSlots.includes(requestedSlot)) {
    return requestedSlot;
  }

  const readSlotKind = (slot: SlotName) =>
    getChatViewEntityBinding(runtime.slotBindings[slot])?.kind;
  // A slot is free only with neither a base binding nor a covering layer stack: binding into the
  // base beneath a layer would render invisibly.
  const isFree = (slot: SlotName) =>
    !runtime.slotBindings[slot] && !runtime.slotLayers[slot]?.length;
  const sameKind = runtime.availableSlots.find((slot) => readSlotKind(slot) === kind);
  const firstFreeNonPersistent = runtime.availableSlots.find(
    (slot) => isFree(slot) && !isPersistentSlot(slot),
  );
  const firstFree = runtime.availableSlots.find((slot) => isFree(slot));
  // When every slot is occupied, target the last non-persistent slot rather than the first. Slots
  // run primary to secondary and the first holds the anchor content (e.g. the main channel), so a
  // new panel lands on the latest secondary panel rather than on the primary.
  const lastNonPersistent = [...runtime.availableSlots]
    .reverse()
    .find((slot) => !isPersistentSlot(slot));

  // `additive` opens beside existing content (ctrl/⌘-click): skip the same-kind slot, which would
  // replace what it shows, and prefer a free or secondary slot. A single-slot layout falls
  // through to that slot, so it opens normally.
  if (additive) {
    return firstFreeNonPersistent ?? firstFree ?? lastNonPersistent;
  }

  return sameKind ?? firstFreeNonPersistent ?? firstFree ?? lastNonPersistent;
};

export type OpenThreadTarget =
  | StreamThread
  | { channel: StreamChannel; message: LocalMessage };

/**
 * Builds the `thread` binding for a reply thread via `client.threads.ensure()`, ready for `open`.
 *
 * @param client - Client whose thread manager resolves the thread.
 * @param target - Channel and parent message of the thread.
 * @returns The thread entity binding, keyed by the thread ID.
 */
export const createThreadEntityBinding = (
  client: StreamChat,
  target: { channel: StreamChannel; message: LocalMessage },
): ChatViewEntityBinding => {
  // `ensure()` registers a thread it builds, so a thread opened beside another one stays live
  // even though only the active slot's thread is activated.
  const thread = client.threads.ensure({
    channel: target.channel,
    parentMessage: target.message,
  });
  return { key: thread.id ?? undefined, kind: 'thread', source: thread };
};

/** Options for {@link ChatViewNavigation.open}. */
export type ChatViewOpenOptions = {
  /**
   * Opens beside existing content instead of replacing it, e.g. ctrl/⌘-click a channel to open a
   * second one side by side. The resolver skips the slot already holding the same kind and targets
   * the first free non-persistent slot, then any free slot, then the last non-persistent slot. A
   * single-slot layout has no secondary slot, so it opens normally. Does not affect slot choice
   * when `slot` is set.
   *
   * @default false
   */
  additive?: boolean;
  /**
   * Pushes the binding as a layer over the target slot's current content instead of replacing it,
   * without closing dependent slots; `close`/`popLayer` later reveals what was underneath. Combine
   * with `additive` to stack onto the secondary slot, e.g. a channel over an open reply thread.
   * `layer` chooses stack versus replace; `slot` and `additive` choose which slot.
   *
   * @default false
   */
  layer?: boolean;
  /**
   * Slot to bind into. Takes precedence over `additive` and the default kind-based resolution, and
   * is ignored when the slot is not part of the target view's layout.
   */
  slot?: SlotName;
};

export type ChatViewNavigation = {
  /**
   * Dismisses the top of `slot`: the topmost layer if there is one, otherwise the base binding.
   * A persistent base binding is never released.
   */
  close: (slot: SlotName) => void;
  /**
   * Closes `slot` entirely: its base binding and every layer stacked on it. Unlike {@link close}
   * it does not step back one layer. No-op for empty or persistent slots.
   */
  release: (slot: SlotName) => void;
  /** Hides `slot` without releasing its binding; the subtree stays mounted. */
  hide: (slot: SlotName) => void;
  /**
   * Pushes `binding` as a layer over `slot`'s current content, which stays mounted but hidden. Use
   * it for transient overlays, e.g. a member profile over a thread. A covered layer keeps its
   * state, but the base content remounts on the first push and the last pop. Layers are not
   * serialized.
   */
  pushLayer: (slot: SlotName, binding: ChatViewEntityBinding) => void;
  /** Pops `slot`'s top layer, revealing what is beneath. No-op when there are no layers. */
  popLayer: (slot: SlotName) => void;
  /**
   * Binds `binding` into a resolved target slot, switching to the binding kind's view first (a
   * `channel` binding activates the channels view). For channel and thread opens without
   * `options.additive`, a matching `viewActionSlotResolvers` entry picks the slot first; otherwise
   * slot resolution is, in order:
   * 1. `options.slot`, if it exists in the target view's layout;
   * 2. unless `options.additive` is set, the slot already holding this `kind` (replacing it);
   * 3. the first free non-persistent slot;
   * 4. the first free slot;
   * 5. the last non-persistent slot, so a secondary panel is targeted before the primary one.
   *
   * On an occupied secondary slot the binding is pushed as a layer over the current content, unless
   * the slot's base already holds this kind; a channel opened with `additive` is layered even then.
   *
   * @param binding - Entity to open.
   * @param options - See {@link ChatViewOpenOptions}.
   * @returns An {@link OpenResult}. When no slot resolves, the call is a rejected no-op: no view
   * switch and no dependent-slot teardown.
   */
  open: (binding: ChatViewEntityBinding, options?: ChatViewOpenOptions) => OpenResult;
  /**
   * Switches the active view, passing `options.slot` to `layoutController.openView`; the default
   * `LayoutController` ignores it.
   */
  openView: (view: ChatView, options?: { slot?: SlotName }) => void;
  /** Reveals a previously hidden `slot`. */
  unhide: (slot: SlotName) => void;
};

const chatViewNavigationStateSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
});

const ChatViewNavigationContext = createContext<ChatViewNavigation>({
  close: () => undefined,
  hide: () => undefined,
  open: () => ({ reason: 'no-available-slot', status: 'rejected' }),
  openView: () => undefined,
  popLayer: () => undefined,
  pushLayer: () => undefined,
  release: () => undefined,
  unhide: () => undefined,
});

export const useChatViewNavigation = () => useContext(ChatViewNavigationContext);

/** The slot (in the active view) currently holding a binding of `kind`, if any. */
export const useSlotForKind = (
  kind: ChatViewEntityBinding['kind'],
): SlotName | undefined => {
  const { availableSlots, slotBindings } = useLayoutViewState();
  return useMemo(
    () =>
      availableSlots.find(
        (slot) => getChatViewEntityBinding(slotBindings[slot])?.kind === kind,
      ),
    [availableSlots, kind, slotBindings],
  );
};

/** The slot (in the active view) whose binding carries entity `key`, if any. */
export const useSlotForKey = (key?: string): SlotName | undefined => {
  const { availableSlots, slotBindings } = useLayoutViewState();
  return useMemo(
    () =>
      key === undefined
        ? undefined
        : availableSlots.find(
            (slot) => getChatViewEntityBinding(slotBindings[slot])?.key === key,
          ),
    [availableSlots, key, slotBindings],
  );
};

export const ChatViewNavigationProvider = ({ children }: PropsWithChildren) => {
  const { layoutController, resolveActionTargetSlot } = useChatViewContext();
  const registry = useSlotRegistry();
  const { availableSlots, slotBindings, slotLayers } = useLayoutViewState();
  const { activeView } =
    useStateStore(layoutController.state, chatViewNavigationStateSelector) ??
    chatViewNavigationStateSelector(layoutController.state.getLatestValue());

  const value = useMemo<ChatViewNavigation>(() => {
    const slotKind = (slot: SlotName) =>
      getChatViewEntityBinding(slotBindings[slot])?.kind;

    const buildRuntimeForView = (view: ChatView): ViewSlotRuntime => {
      const state = layoutController.state.getLatestValue();
      const viewState = getLayoutViewState(state, view);

      return {
        activeViewState: viewState,
        availableSlots: viewState.availableSlots,
        orderedSlots: viewState.slotNames?.length
          ? viewState.slotNames
          : viewState.availableSlots,
        slotBindings: viewState.slotBindings,
        slotLayers: viewState.slotLayers ?? {},
      };
    };

    const makeIsPersistentSlot = (runtime: ViewSlotRuntime) => (slot: SlotName) =>
      isPersistentSlotKind(
        registry,
        getChatViewEntityBinding(runtime.slotBindings[slot])?.kind,
      );

    const materializeTargetSlot = (runtime: ViewSlotRuntime, slot?: SlotName) => {
      if (!slot) return undefined;
      if (runtime.availableSlots.includes(slot)) return slot;
      if (!runtime.orderedSlots.includes(slot)) return undefined;

      const nextAvailableSlots = runtime.orderedSlots.filter(
        (candidate) => runtime.availableSlots.includes(candidate) || candidate === slot,
      );
      layoutController.setAvailableSlots(nextAvailableSlots);
      return slot;
    };

    const resolveTargetSlot = ({
      additive,
      kind,
      requestedSlot,
      runtime,
      view,
    }: {
      additive?: boolean;
      kind: ChatViewEntityBinding['kind'];
      requestedSlot?: SlotName;
      runtime: ViewSlotRuntime;
      view: ChatView;
    }) => {
      // Per-view action resolvers (`viewActionSlotResolvers`) run first for channel and thread
      // opens. `additive` skips them: the default resolver holds the "prefer a free or secondary
      // slot" logic.
      const action =
        !additive && kind === 'channel'
          ? 'openChannel'
          : !additive && kind === 'thread'
            ? 'openThread'
            : undefined;
      if (action) {
        const args: ResolveViewActionTargetSlotArgs = {
          action,
          activeView: view,
          availableSlots: runtime.availableSlots,
          requestedSlot,
          slotBindings: runtime.slotBindings,
          slotNames: runtime.orderedSlots,
        };
        const customTargetSlot = resolveActionTargetSlot(view, args);
        if (customTargetSlot) {
          const materialized = materializeTargetSlot(runtime, customTargetSlot);
          if (materialized) return materialized;
        }
      }

      return materializeTargetSlot(
        runtime,
        resolveDefaultTargetSlot({
          additive,
          isPersistentSlot: makeIsPersistentSlot(runtime),
          kind,
          requestedSlot,
          runtime,
        }),
      );
    };

    const openView: ChatViewNavigation['openView'] = (view, options) => {
      layoutController.openView(view, { slot: options?.slot });
    };

    // Replacing a channel closes the reply threads opened from it. A thread slot is released, but
    // content stacked over the thread (a channel opened beside it) stays, its top layer becoming
    // the slot's base. A reply thread of `replacedChannel` stacked over another panel is popped,
    // revealing that panel.
    const closeReplyThreads = (replacedChannel?: StreamChannel) => {
      availableSlots.forEach((slot) => {
        const layers = slotLayers?.[slot] ?? [];
        const top = layers[layers.length - 1];
        const topEntity = getChatViewEntityBinding(top);
        if (
          replacedChannel &&
          topEntity?.kind === 'thread' &&
          topEntity.source.channel?.cid === replacedChannel.cid
        ) {
          layoutController.popLayer(slot);
          return;
        }
        if (slotKind(slot) !== 'thread') return;
        if (!top) {
          layoutController.release(slot);
          return;
        }
        layoutController.bind(slot, top);
        layoutController.popLayer(slot);
      });
    };

    const open: ChatViewNavigation['open'] = (binding, options) => {
      // Resolve the target slot before any mutation, so a rejected open is a no-op: no view switch
      // and no dependent-slot teardown.
      const kindView = resolveSlotKindView(registry, binding.kind);
      const targetView = kindView ?? activeView;
      const runtime = buildRuntimeForView(targetView);
      const targetSlot = resolveTargetSlot({
        additive: options?.additive,
        kind: binding.kind,
        requestedSlot: options?.slot,
        runtime,
        view: targetView,
      });

      if (!targetSlot) {
        return { reason: 'no-available-slot', status: 'rejected' };
      }

      // Kinds that declare a target view switch to it on open (e.g. channel ->
      // channels); view-agnostic kinds (thread) open in the active view.
      if (kindView) openView(targetView, options);

      // Push a layer when `options.layer` asks for it, or when the target is an occupied secondary
      // slot (a base binding or a covering layer) and this is not a same-kind replace. Otherwise
      // the primary slot (first non-persistent) base-binds, so selecting a channel replaces it and
      // single-slot layouts do not layer. A same-kind base (thread over thread in its own slot)
      // replaces too, except a channel opened beside another (`additive`), which stacks so that
      // stepping back returns to the previous channel.
      const isPersistentSlot = makeIsPersistentSlot(runtime);
      const anchorSlot = runtime.availableSlots.find((slot) => !isPersistentSlot(slot));
      const targetBase = runtime.slotBindings[targetSlot];
      const targetBaseKind = getChatViewEntityBinding(targetBase)?.kind;
      const targetOccupied = !!targetBase || !!runtime.slotLayers[targetSlot]?.length;
      const isSecondaryTarget = targetSlot !== anchorSlot;
      // Opening beside what the target slot already shows on top changes nothing. Anything else (a
      // channel lower in its stack, or open in another slot) is stacked on top so it is shown.
      const shownInTarget = getChatViewEntityBinding(
        runtime.slotLayers[targetSlot]?.at(-1) ?? targetBase,
      );
      if (
        options?.additive &&
        isSecondaryTarget &&
        binding.key !== undefined &&
        shownInTarget?.key === binding.key
      ) {
        return { slot: targetSlot, status: 'opened' };
      }
      const stacksBesideSameKind = !!options?.additive && binding.kind === 'channel';
      const sameKindBaseReplace =
        !!targetBase && targetBaseKind === binding.kind && !stacksBesideSameKind;

      if (
        options?.layer ||
        (isSecondaryTarget && targetOccupied && !sameKindBaseReplace)
      ) {
        layoutController.pushLayer(targetSlot, createChatViewSlotBinding(binding));
        return { slot: targetSlot, status: 'layered' };
      }

      // Replacing a channel closes the threads bound to the previous one. Layered opens returned
      // above and skip this.
      if (binding.kind === 'channel') {
        const replaced = getChatViewEntityBinding(targetBase);
        closeReplyThreads(replaced?.kind === 'channel' ? replaced.source : undefined);
      }

      return layoutController.openInLayout(createChatViewSlotBinding(binding), {
        targetSlot,
      });
    };

    const close: ChatViewNavigation['close'] = (slot) => {
      if (!availableSlots.includes(slot)) return;
      // Layers dismiss top-down: pop the topmost layer first and only release the base binding
      // once no layers remain.
      if (slotLayers?.[slot]?.length) {
        layoutController.popLayer(slot);
        return;
      }
      // Persistent kinds (nav-rail lists) are hide-only; close never releases them.
      if (isPersistentSlotKind(registry, slotKind(slot))) return;
      layoutController.release(slot);
    };

    const release: ChatViewNavigation['release'] = (slot) => {
      if (!availableSlots.includes(slot)) return;
      if (isPersistentSlotKind(registry, slotKind(slot))) return;
      layoutController.release(slot);
    };

    const hide: ChatViewNavigation['hide'] = (slot) => {
      if (availableSlots.includes(slot)) layoutController.hide(slot);
    };

    const pushLayer: ChatViewNavigation['pushLayer'] = (slot, binding) => {
      if (!availableSlots.includes(slot)) return;
      layoutController.pushLayer(slot, createChatViewSlotBinding(binding));
    };

    const popLayer: ChatViewNavigation['popLayer'] = (slot) => {
      if (availableSlots.includes(slot)) layoutController.popLayer(slot);
    };

    const unhide: ChatViewNavigation['unhide'] = (slot) => {
      if (availableSlots.includes(slot)) layoutController.unhide(slot);
    };

    return { close, hide, open, openView, popLayer, pushLayer, release, unhide };
  }, [
    activeView,
    availableSlots,
    layoutController,
    registry,
    resolveActionTargetSlot,
    slotBindings,
    slotLayers,
  ]);

  return (
    <ChatViewNavigationContext.Provider value={value}>
      {children}
    </ChatViewNavigationContext.Provider>
  );
};
