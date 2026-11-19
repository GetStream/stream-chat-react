import React, { createContext, useContext, useMemo } from 'react';

import { getChatViewEntityBinding, useChatViewContext } from './ChatView';
import { ChatViewNavigator } from './ChatViewNavigator';
import { useLayoutViewState } from './hooks/useLayoutViewState';
import { useSlotRegistry } from './slotRegistry';

import type { PropsWithChildren } from 'react';
import type {
  LocalMessage,
  Channel as StreamChannel,
  StreamChat,
  Thread as StreamThread,
} from 'stream-chat';
import type { ChatView, ChatViewEntityBinding } from './ChatView';
import type { OpenResult, SlotName } from './layoutController/layoutControllerTypes';

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
   * Shows the binding on its own, whatever its kind: every slot of the target view is emptied, and
   * the binding becomes the only content of the primary slot (the first one not holding a
   * persistent list), or of `slot` when set. Persistent slots (nav-rail lists) stay. Skips the
   * kind-based slot resolution and `viewActionSlotResolvers`. Ignored with `additive`.
   *
   * @default false
   */
  exclusive?: boolean;
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

  // The navigator reads the layout's latest state on every call, so it is created once per layout
  // controller, slot registry and action resolver, not on every layout change.
  const value = useMemo<ChatViewNavigation>(
    () => new ChatViewNavigator({ layoutController, registry, resolveActionTargetSlot }),
    [layoutController, registry, resolveActionTargetSlot],
  );

  return (
    <ChatViewNavigationContext.Provider value={value}>
      {children}
    </ChatViewNavigationContext.Provider>
  );
};
