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
import { Thread as StreamThreadClass } from 'stream-chat';
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
};

const resolveGeneratedSlots = (slotCount: number): SlotName[] =>
  Array.from(
    { length: Math.max(0, slotCount) },
    (_, index) => `slot${index + 1}` as SlotName,
  );

// D6 — the resolver is kind-driven and persistent-aware (via the registry), not
// keyed on a fixed set of actions or a hardcoded list-kind set. Precedence:
// reuse a same-kind slot -> first free non-persistent -> first free -> first
// non-persistent. Persistent (list) slots are never an implicit target and there
// is deliberately no "last slot" fallback, so when only persistent slots remain
// the resolver returns undefined and `openInLayout` rejects rather than
// destroying a list.
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
  const sameKind = runtime.availableSlots.find((slot) => readSlotKind(slot) === kind);
  const firstFreeNonPersistent = runtime.availableSlots.find(
    (slot) => !runtime.slotBindings[slot] && !isPersistentSlot(slot),
  );
  const firstFree = runtime.availableSlots.find((slot) => !runtime.slotBindings[slot]);
  // When every slot is occupied, evict the LAST non-persistent slot rather than the first.
  // Slots run primary -> secondary, so the first slot holds the anchor content (e.g. the main
  // channel); a newly-opened panel — a reply thread opened while a 2nd channel occupies the
  // secondary slot, say — should replace the most-recent secondary panel, never make the
  // primary disappear.
  const lastNonPersistent = [...runtime.availableSlots]
    .reverse()
    .find((slot) => !isPersistentSlot(slot));

  // `additive` opens *beside* existing content (ctrl/⌘-click): skip the same-kind slot, which
  // would replace the current primary, and prefer a free/secondary slot instead. In a
  // single-slot layout it falls through to that slot, so it degrades to a normal open.
  if (additive) {
    return firstFreeNonPersistent ?? firstFree ?? lastNonPersistent;
  }

  return sameKind ?? firstFreeNonPersistent ?? firstFree ?? lastNonPersistent;
};

export type OpenThreadTarget =
  | StreamThread
  | { channel: StreamChannel; message: LocalMessage };

/**
 * Binding builder for the `thread` kind (D6). The `{ channel, message }` ->
 * `Thread` construction (with dedupe against `client.threads`) lives here so
 * callers can drive the generic `open` with a ready binding instead of a
 * thread-specific navigation method.
 */
export const createThreadEntityBinding = (
  client: StreamChat,
  target: { channel: StreamChannel; message: LocalMessage },
): ChatViewEntityBinding => {
  const existingThread = client.threads.threadsById[target.message.id];
  const thread =
    existingThread ??
    new StreamThreadClass({
      channel: target.channel,
      client,
      parentMessage: target.message,
    });
  return { key: thread.id ?? undefined, kind: 'thread', source: thread };
};

/** Options for {@link ChatViewNavigation.open}. */
export type ChatViewOpenOptions = {
  /**
   * Open *beside* existing content instead of replacing it.
   *
   * By default `open` reuses the slot that already holds the binding's `kind` (so selecting a
   * channel replaces the current channel). With `additive: true` the resolver skips that
   * same-kind slot and instead targets the first free non-persistent slot — falling back to the
   * last non-persistent slot when every slot is occupied. The effect is that the entity opens in
   * a *secondary* slot next to the current one (e.g. ctrl/⌘-click a channel to open a 2nd channel
   * side-by-side, or a search result beside the open channel).
   *
   * In a single-slot layout there is no secondary slot to open into, so it falls back to that
   * one slot and behaves like a normal open. Ignored when an explicit `slot` is provided.
   *
   * @default false
   */
  additive?: boolean;
  /**
   * Bind into this specific slot, when it exists in the target view's layout. Takes precedence
   * over `additive` and over the default kind-based slot resolution. Ignored (falls back to the
   * default resolution) when the named slot is not part of the active layout.
   */
  slot?: SlotName;
};

export type ChatViewNavigation = {
  /** Release the binding held by `slot`. No-op for empty or persistent slots. */
  close: (slot: SlotName) => void;
  /** Hide `slot` without releasing its binding (subtree stays mounted). */
  hide: (slot: SlotName) => void;
  /**
   * Resolve a target slot for `binding` and bind it there, switching to the binding kind's view
   * first if needed (e.g. a `channel` binding activates the channels view).
   *
   * Slot resolution, in order:
   * 1. `options.slot`, if that slot exists in the target view's layout;
   * 2. otherwise, unless `options.additive` is set, the slot already holding this `kind`
   *    (replacing its content);
   * 3. the first free non-persistent slot;
   * 4. the first free slot;
   * 5. the last non-persistent slot (evicting a secondary panel — never the primary).
   *
   * See {@link ChatViewOpenOptions.additive} for opening *beside* current content instead of
   * replacing.
   *
   * Returns an {@link OpenResult}; if no slot can be resolved the call is a rejected no-op — no
   * view switch and no dependent-slot teardown, so a rejected open never leaves a partial state.
   */
  open: (binding: ChatViewEntityBinding, options?: ChatViewOpenOptions) => OpenResult;
  /** Switch the active view (channels/threads); optionally focus a specific `slot`. */
  openView: (view: ChatView, options?: { slot?: SlotName }) => void;
  /** Reveal a previously hidden `slot`. */
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
  const { availableSlots, slotBindings } = useLayoutViewState();
  const { activeView } =
    useStateStore(layoutController.state, chatViewNavigationStateSelector) ??
    chatViewNavigationStateSelector(layoutController.state.getLatestValue());

  const value = useMemo<ChatViewNavigation>(() => {
    const slotKind = (slot: SlotName) =>
      getChatViewEntityBinding(slotBindings[slot])?.kind;

    const findCandidateSlotsByKind = (kind: ChatViewEntityBinding['kind']) =>
      availableSlots.filter((slot) => slotKind(slot) === kind);

    const buildRuntimeForView = (view: ChatView): ViewSlotRuntime => {
      const state = layoutController.state.getLatestValue();
      const viewState = getLayoutViewState(state, view);
      const inferredMaxSlots = Math.max(
        state.maxSlots ?? viewState.availableSlots.length,
        viewState.availableSlots.length,
      );

      return {
        activeViewState: viewState,
        availableSlots: viewState.availableSlots,
        orderedSlots: viewState.slotNames?.length
          ? viewState.slotNames
          : resolveGeneratedSlots(inferredMaxSlots),
        slotBindings: viewState.slotBindings,
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
      // Preserve the public per-view resolver extension point (keyed on the
      // channel/thread actions) for the kinds that have one. `additive` (open beside) skips it
      // and uses the default resolver, which is where the "prefer a free/secondary slot" logic
      // lives.
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

    const releaseKind = (kind: ChatViewEntityBinding['kind']) =>
      findCandidateSlotsByKind(kind).forEach((slot) => layoutController.release(slot));

    const open: ChatViewNavigation['open'] = (binding, options) => {
      // Resolve the target slot BEFORE any mutation: a rejected open is a no-op
      // (no view switch, no dependent-slot teardown), never a destructive
      // partial navigation.
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
      // Dependent-slot invalidation: opening a channel closes threads bound to
      // the previous channel. (Interim kind check; a later step may express this
      // as registry policy.)
      if (binding.kind === 'channel') releaseKind('thread');

      return layoutController.openInLayout(createChatViewSlotBinding(binding), {
        targetSlot,
      });
    };

    const close: ChatViewNavigation['close'] = (slot) => {
      if (!availableSlots.includes(slot)) return;
      // Persistent kinds (nav-rail lists) are hide-only; close never releases them.
      if (isPersistentSlotKind(registry, slotKind(slot))) return;
      layoutController.release(slot);
    };

    const hide: ChatViewNavigation['hide'] = (slot) => {
      if (availableSlots.includes(slot)) layoutController.hide(slot);
    };

    const unhide: ChatViewNavigation['unhide'] = (slot) => {
      if (availableSlots.includes(slot)) layoutController.unhide(slot);
    };

    return { close, hide, open, openView, unhide };
  }, [
    activeView,
    availableSlots,
    layoutController,
    registry,
    resolveActionTargetSlot,
    slotBindings,
  ]);

  return (
    <ChatViewNavigationContext.Provider value={value}>
      {children}
    </ChatViewNavigationContext.Provider>
  );
};
