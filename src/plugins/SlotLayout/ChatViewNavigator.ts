// The `ChatViewNavigation` behind `useChatViewNavigation()`. Internal to the SlotLayout plugin:
// `index.tsx` does not re-export it.

import { unstable_batchedUpdates } from 'react-dom';

import { getLayoutViewState } from './hooks/useLayoutViewState';
import { createChatViewSlotBinding, getChatViewEntityBinding } from './slotBinding';
import { isPersistentSlotKind, resolveSlotKindView } from './slotRegistry';
import {
  applySlotStack,
  closeReplyThreads,
  findInStack,
  isStackEmpty,
  moveToTop,
  readSlotStack,
  topOfStack,
} from './slotStack';

import type {
  ChatView,
  ChatViewNavigationAction,
  ResolveViewActionTargetSlotArgs,
} from './ChatView';
import type {
  ChatViewNavigation,
  ChatViewOpenOptions,
} from './ChatViewNavigationContext';
import type {
  ChatViewLayoutViewState,
  LayoutController,
  LayoutSlotBinding,
  OpenResult,
  SlotName,
} from './layoutController/layoutControllerTypes';
import type { ChatViewEntityBinding } from './slotBinding';
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

const toViewSlotRuntime = (viewState: ChatViewLayoutViewState): ViewSlotRuntime => ({
  availableSlots: viewState.availableSlots,
  orderedSlots: viewState.slotNames?.length
    ? viewState.slotNames
    : viewState.availableSlots,
  slotBindings: viewState.slotBindings,
  slotLayers: viewState.slotLayers ?? {},
});

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

type ResolveActionTargetSlot = (
  view: ChatView,
  args: ResolveViewActionTargetSlotArgs,
) => SlotName | undefined;

export type ChatViewNavigatorOptions = {
  layoutController: LayoutController;
  registry: SlotKindRegistry;
  resolveActionTargetSlot: ResolveActionTargetSlot;
};

/**
 * Decides where and how an entity opens or closes in a `ChatView`: the view and slot, whether it
 * replaces, stacks or moves to the top, and which reply threads close with it. It keeps no state
 * and applies its decisions through the {@link LayoutController}, reading its latest state on
 * every call, so calls made one after another each see the changes of the ones before. Methods
 * are arrow properties, so they keep working when destructured.
 */
export class ChatViewNavigator implements ChatViewNavigation {
  private readonly layoutController: LayoutController;
  private readonly registry: SlotKindRegistry;
  private readonly resolveActionTargetSlot: ResolveActionTargetSlot;

  constructor({
    layoutController,
    registry,
    resolveActionTargetSlot,
  }: ChatViewNavigatorOptions) {
    this.layoutController = layoutController;
    this.registry = registry;
    this.resolveActionTargetSlot = resolveActionTargetSlot;
  }

  // An open can take several controller writes (closing threads, re-stacking layers). They render
  // as one update, also where React does not batch on its own (React 17, or a legacy root, outside
  // an event handler), so the layers that stay are not unmounted in between.
  open: ChatViewNavigation['open'] = (binding, options) =>
    unstable_batchedUpdates(() => this.openUnbatched(binding, options));

  openView: ChatViewNavigation['openView'] = (view, options) => {
    this.layoutController.openView(view, { slot: options?.slot });
  };

  close: ChatViewNavigation['close'] = (slot) => {
    const viewState = this.readActiveView();
    if (!viewState.availableSlots.includes(slot)) return;
    // Layers dismiss top-down: pop the topmost layer first and only release the base binding
    // once no layers remain.
    if (viewState.slotLayers?.[slot]?.length) {
      this.layoutController.popLayer(slot);
      return;
    }
    // Persistent kinds (nav-rail lists) are hide-only; close never releases them.
    if (!this.isPersistentSlot(viewState.slotBindings, slot)) {
      this.layoutController.release(slot);
    }
  };

  release: ChatViewNavigation['release'] = (slot) => {
    const viewState = this.readActiveView();
    if (
      viewState.availableSlots.includes(slot) &&
      !this.isPersistentSlot(viewState.slotBindings, slot)
    ) {
      this.layoutController.release(slot);
    }
  };

  hide: ChatViewNavigation['hide'] = (slot) => {
    if (this.hasSlot(slot)) this.layoutController.hide(slot);
  };

  unhide: ChatViewNavigation['unhide'] = (slot) => {
    if (this.hasSlot(slot)) this.layoutController.unhide(slot);
  };

  pushLayer: ChatViewNavigation['pushLayer'] = (slot, binding) => {
    if (this.hasSlot(slot)) {
      this.layoutController.pushLayer(slot, createChatViewSlotBinding(binding));
    }
  };

  popLayer: ChatViewNavigation['popLayer'] = (slot) => {
    if (this.hasSlot(slot)) this.layoutController.popLayer(slot);
  };

  private openUnbatched(
    binding: ChatViewEntityBinding,
    options?: ChatViewOpenOptions,
  ): OpenResult {
    // Resolve the target slot before any mutation, so a rejected open is a no-op: no view switch
    // and no dependent-slot teardown.
    const state = this.layoutController.state.getLatestValue();
    const kindView = resolveSlotKindView(this.registry, binding.kind);
    const targetView = kindView ?? state.activeView;
    const runtime = toViewSlotRuntime(getLayoutViewState(state, targetView));

    if (options?.exclusive && !options.additive) {
      const slot =
        this.materializeTargetSlot(runtime, options.slot) ?? this.primarySlot(runtime);
      if (!slot) return { reason: 'no-available-slot', status: 'rejected' };
      if (kindView) this.openView(targetView, options);
      return this.openAlone(binding, slot, targetView);
    }

    const targetSlot = this.resolveTargetSlot({
      additive: options?.additive,
      kind: binding.kind,
      requestedSlot: options?.slot,
      runtime,
      view: targetView,
    });
    if (!targetSlot) return { reason: 'no-available-slot', status: 'rejected' };

    // Kinds that declare a target view switch to it on open (e.g. channel -> channels);
    // view-agnostic kinds (thread) open in the active view.
    if (kindView) this.openView(targetView, options);

    const stack = readSlotStack(runtime, targetSlot);
    const placement = resolveOpenPlacement({
      binding,
      isSecondarySlot: targetSlot !== this.primarySlot(runtime),
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
        this.layoutController,
        targetSlot,
        stack,
        moveToTop(stack, index, entry),
      );
      return { slot: targetSlot, status: 'opened' };
    }

    if (placement.type === 'layer') {
      this.layoutController.pushLayer(targetSlot, createChatViewSlotBinding(binding));
      return { slot: targetSlot, status: 'layered' };
    }

    // A channel replacing the base closes the reply threads it leaves behind in this slot only;
    // threads in other slots stay open.
    if (binding.kind === 'channel') {
      applySlotStack(
        this.layoutController,
        targetSlot,
        stack,
        closeReplyThreads(stack, binding.source),
      );
    }
    return this.layoutController.openInLayout(createChatViewSlotBinding(binding), {
      targetSlot,
    });
  }

  private resolveTargetSlot({
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
  }) {
    // A per-view action resolver runs first. `additive` skips it: the default resolver holds the
    // "prefer a free or secondary slot" logic.
    const action = additive ? undefined : VIEW_ACTION_BY_KIND[kind];
    if (action) {
      const customTargetSlot = this.materializeTargetSlot(
        runtime,
        this.resolveActionTargetSlot(view, {
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

    return this.materializeTargetSlot(
      runtime,
      resolveDefaultTargetSlot({
        additive,
        isPersistentSlot: (slot) => this.isPersistentSlot(runtime.slotBindings, slot),
        kind,
        requestedSlot,
        runtime,
      }),
    );
  }

  // The view's primary slot: its first slot that does not hold a persistent list.
  private primarySlot(runtime: ViewSlotRuntime) {
    return runtime.availableSlots.find(
      (slot) => !this.isPersistentSlot(runtime.slotBindings, slot),
    );
  }

  // Leaves `binding` as the only content of `view`: every other non-persistent slot is released,
  // and `slot` keeps no layers, with `binding` as its base.
  private openAlone(
    binding: ChatViewEntityBinding,
    slot: SlotName,
    view: ChatView,
  ): OpenResult {
    const runtime = toViewSlotRuntime(
      getLayoutViewState(this.layoutController.state.getLatestValue(), view),
    );
    runtime.availableSlots.forEach((other) => {
      if (
        other !== slot &&
        !isStackEmpty(readSlotStack(runtime, other)) &&
        !this.isPersistentSlot(runtime.slotBindings, other)
      ) {
        this.layoutController.release(other);
      }
    });

    const stack = readSlotStack(runtime, slot);
    applySlotStack(this.layoutController, slot, stack, { ...stack, layers: [] });

    // The base already shows this entity: it stays, or takes the new instance in place.
    if (stack.base && findInStack(stack, binding) === 0) {
      if (getChatViewEntityBinding(stack.base)?.source !== binding.source) {
        this.layoutController.bind(slot, createChatViewSlotBinding(binding));
      }
      return { slot, status: 'opened' };
    }
    return this.layoutController.openInLayout(createChatViewSlotBinding(binding), {
      targetSlot: slot,
    });
  }

  // Makes a slot the view's layout declares available, so a binding can go into it.
  private materializeTargetSlot(runtime: ViewSlotRuntime, slot?: SlotName) {
    if (!slot) return undefined;
    if (runtime.availableSlots.includes(slot)) return slot;
    if (!runtime.orderedSlots.includes(slot)) return undefined;

    const nextAvailableSlots = runtime.orderedSlots.filter(
      (candidate) => runtime.availableSlots.includes(candidate) || candidate === slot,
    );
    this.layoutController.setAvailableSlots(nextAvailableSlots);
    return slot;
  }

  private readActiveView() {
    return getLayoutViewState(this.layoutController.state.getLatestValue());
  }

  private hasSlot(slot: SlotName) {
    return this.readActiveView().availableSlots.includes(slot);
  }

  private isPersistentSlot(
    slotBindings: Record<SlotName, LayoutSlotBinding | undefined>,
    slot: SlotName,
  ) {
    return isPersistentSlotKind(
      this.registry,
      getChatViewEntityBinding(slotBindings[slot])?.kind,
    );
  }
}
