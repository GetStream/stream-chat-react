import React, { createContext, useContext, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { useStateStore } from '../../store';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from './ChatView';
import { getLayoutViewState, useLayoutViewState } from './hooks/useLayoutViewState';
import {
  isPersistentSlotKind,
  resolveSlotKindView,
  useSlotRegistry,
} from './slotRegistry';
import {
  applySlotStack,
  closeReplyThreads,
  findInStack,
  isStackEmpty,
  moveToTop,
  readSlotStack,
  topOfStack,
} from './slotStack';

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
  ChatViewNavigationAction,
} from './ChatView';
import type {
  ChatViewLayoutState,
  LayoutSlotBinding,
  OpenResult,
  SlotName,
} from './layoutController/layoutControllerTypes';
import type { SlotKindRegistry } from './slotRegistry';
import type { SlotStack } from './slotStack';

/** The slot state of one view, read from the layout controller's latest state. */
type ViewSlotRuntime = {
  availableSlots: SlotName[];
  /** Every slot the view's layout declares, in order, including ones not available yet. */
  orderedSlots: SlotName[];
  slotBindings: Record<SlotName, LayoutSlotBinding | undefined>;
  slotLayers: Record<SlotName, LayoutSlotBinding[] | undefined>;
};

const readViewRuntime = (state: ChatViewLayoutState, view: ChatView): ViewSlotRuntime => {
  const viewState = getLayoutViewState(state, view);
  return {
    availableSlots: viewState.availableSlots,
    orderedSlots: viewState.slotNames?.length
      ? viewState.slotNames
      : viewState.availableSlots,
    slotBindings: viewState.slotBindings,
    slotLayers: viewState.slotLayers ?? {},
  };
};

const makeIsPersistentSlot =
  (
    registry: SlotKindRegistry,
    slotBindings: Record<SlotName, LayoutSlotBinding | undefined>,
  ) =>
  (slot: SlotName) =>
    isPersistentSlotKind(registry, getChatViewEntityBinding(slotBindings[slot])?.kind);

// Per-view action resolvers (`viewActionSlotResolvers`) can pick the slot for these kinds.
const VIEW_ACTION_BY_KIND: Partial<
  Record<ChatViewEntityBinding['kind'], ChatViewNavigationAction>
> = {
  channel: 'openChannel',
  thread: 'openThread',
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
  const isFree = (slot: SlotName) => isStackEmpty(readSlotStack(runtime, slot));
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

/** How `open` puts a binding into its target slot. */
type OpenPlacement =
  /** The slot already shows it on top: nothing changes. */
  | { type: 'alreadyShown' }
  /**
   * The slot holds it (`held`) at `index` of its stack (see `findInStack`): it moves to the top.
   */
  | { held: LayoutSlotBinding; index: number; type: 'moveToTop' }
  /** It is pushed as a layer over the slot's content. */
  | { type: 'layer' }
  /** It replaces the slot's base. */
  | { type: 'replace' };

// `layer` always stacks. Otherwise the primary slot (the first non-persistent one) replaces its
// base, so selecting a channel replaces it and single-slot layouts do not layer, and an empty slot
// takes the binding as its base. An occupied secondary slot stacks, except that a binding of the
// base's kind replaces the base. Two cases of that kind stack anyway: a channel opened beside
// another (`additive`), so that stepping back returns to the previous channel, and a thread over a
// thread covered by a layer, so the new thread is shown and stepping back returns to the cover.
const resolveOpenPlacement = ({
  binding,
  isSecondarySlot,
  options,
  stack,
}: {
  binding: ChatViewEntityBinding;
  isSecondarySlot: boolean;
  options?: ChatViewOpenOptions;
  stack: SlotStack;
}): OpenPlacement => {
  const { additive, layer } = options ?? {};

  // On a secondary slot, an additive open of what it shows on top changes nothing, and a plain
  // open (neither `additive` nor `layer`) of what it holds anywhere moves that to the top.
  if (isSecondarySlot && binding.key !== undefined) {
    if (additive) {
      if (getChatViewEntityBinding(topOfStack(stack))?.key === binding.key) {
        return { type: 'alreadyShown' };
      }
    } else if (!layer) {
      const index = findInStack(stack, binding);
      const held = [stack.base, ...stack.layers][index];
      if (held) return { held, index, type: 'moveToTop' };
    }
  }

  if (layer) return { type: 'layer' };
  if (!isSecondarySlot || isStackEmpty(stack)) return { type: 'replace' };

  const baseKind = getChatViewEntityBinding(stack.base)?.kind;
  if (baseKind !== binding.kind) return { type: 'layer' };
  if (binding.kind === 'channel' && additive) return { type: 'layer' };
  if (binding.kind === 'thread' && stack.layers.length) return { type: 'layer' };
  return { type: 'replace' };
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
   * the slot's base already holds this kind; a channel opened with `additive` is layered even then,
   * and so is a thread whose slot's base is covered by a layer. Without `additive` or `layer`,
   * opening what the secondary slot already holds moves it to the top of the slot's stack instead
   * of stacking a copy; the rest of the stack keeps its order.
   *
   * A channel closes reply threads in the slot it opens into only: the replaced channel's threads
   * layered over it, or the thread it replaces. Reply threads in other slots stay open.
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
    const hasSlot = (slot: SlotName) => availableSlots.includes(slot);
    const isPersistent = makeIsPersistentSlot(registry, slotBindings);

    // Makes a slot the view's layout declares available, so a binding can go into it.
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
      // A per-view action resolver runs first. `additive` skips it: the default resolver holds the
      // "prefer a free or secondary slot" logic.
      const action = additive ? undefined : VIEW_ACTION_BY_KIND[kind];
      if (action) {
        const customTargetSlot = materializeTargetSlot(
          runtime,
          resolveActionTargetSlot(view, {
            action,
            activeView: view,
            availableSlots: runtime.availableSlots,
            requestedSlot,
            slotBindings: runtime.slotBindings,
            slotNames: runtime.orderedSlots,
          }),
        );
        if (customTargetSlot) return customTargetSlot;
      }

      return materializeTargetSlot(
        runtime,
        resolveDefaultTargetSlot({
          additive,
          isPersistentSlot: makeIsPersistentSlot(registry, runtime.slotBindings),
          kind,
          requestedSlot,
          runtime,
        }),
      );
    };

    const openView: ChatViewNavigation['openView'] = (view, options) => {
      layoutController.openView(view, { slot: options?.slot });
    };

    const openUnbatched: ChatViewNavigation['open'] = (binding, options) => {
      // Resolve the target slot before any mutation, so a rejected open is a no-op: no view switch
      // and no dependent-slot teardown.
      const kindView = resolveSlotKindView(registry, binding.kind);
      const targetView = kindView ?? activeView;
      const runtime = readViewRuntime(
        layoutController.state.getLatestValue(),
        targetView,
      );
      const targetSlot = resolveTargetSlot({
        additive: options?.additive,
        kind: binding.kind,
        requestedSlot: options?.slot,
        runtime,
        view: targetView,
      });
      if (!targetSlot) return { reason: 'no-available-slot', status: 'rejected' };

      // Kinds that declare a target view switch to it on open (e.g. channel -> channels);
      // view-agnostic kinds (thread) open in the active view.
      if (kindView) openView(targetView, options);

      const isPersistentSlot = makeIsPersistentSlot(registry, runtime.slotBindings);
      const primarySlot = runtime.availableSlots.find((slot) => !isPersistentSlot(slot));
      const stack = readSlotStack(runtime, targetSlot);
      const placement = resolveOpenPlacement({
        binding,
        isSecondarySlot: targetSlot !== primarySlot,
        options,
        stack,
      });

      if (placement.type === 'alreadyShown') {
        return { slot: targetSlot, status: 'opened' };
      }

      if (placement.type === 'moveToTop') {
        // When the binding carries another instance of the held entity, that instance moves up.
        const { held, index } = placement;
        const entry =
          getChatViewEntityBinding(held)?.source === binding.source
            ? held
            : createChatViewSlotBinding(binding);
        applySlotStack(
          layoutController,
          targetSlot,
          stack,
          moveToTop(stack, index, entry),
        );
        return { slot: targetSlot, status: 'opened' };
      }

      if (placement.type === 'layer') {
        layoutController.pushLayer(targetSlot, createChatViewSlotBinding(binding));
        return { slot: targetSlot, status: 'layered' };
      }

      // A channel replacing the base closes the reply threads it leaves behind in this slot only;
      // threads in other slots stay open.
      if (binding.kind === 'channel') {
        applySlotStack(
          layoutController,
          targetSlot,
          stack,
          closeReplyThreads(stack, binding.source),
        );
      }
      return layoutController.openInLayout(createChatViewSlotBinding(binding), {
        targetSlot,
      });
    };

    // An open can take several controller writes (closing threads, re-stacking layers). They render
    // as one update, also where React does not batch on its own (React 17, or a legacy root, outside
    // an event handler), so the layers that stay are not unmounted in between.
    const open: ChatViewNavigation['open'] = (binding, options) =>
      unstable_batchedUpdates(() => openUnbatched(binding, options));

    const close: ChatViewNavigation['close'] = (slot) => {
      if (!hasSlot(slot)) return;
      // Layers dismiss top-down: pop the topmost layer first and only release the base binding
      // once no layers remain.
      if (slotLayers?.[slot]?.length) {
        layoutController.popLayer(slot);
        return;
      }
      // Persistent kinds (nav-rail lists) are hide-only; close never releases them.
      if (!isPersistent(slot)) layoutController.release(slot);
    };

    const release: ChatViewNavigation['release'] = (slot) => {
      if (hasSlot(slot) && !isPersistent(slot)) layoutController.release(slot);
    };

    const hide: ChatViewNavigation['hide'] = (slot) => {
      if (hasSlot(slot)) layoutController.hide(slot);
    };

    const unhide: ChatViewNavigation['unhide'] = (slot) => {
      if (hasSlot(slot)) layoutController.unhide(slot);
    };

    const pushLayer: ChatViewNavigation['pushLayer'] = (slot, binding) => {
      if (hasSlot(slot)) {
        layoutController.pushLayer(slot, createChatViewSlotBinding(binding));
      }
    };

    const popLayer: ChatViewNavigation['popLayer'] = (slot) => {
      if (hasSlot(slot)) layoutController.popLayer(slot);
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
