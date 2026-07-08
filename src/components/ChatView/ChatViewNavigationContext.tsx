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
  isPersistentSlot,
  kind,
  requestedSlot,
  runtime,
}: {
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
  const firstNonPersistent = runtime.availableSlots.find(
    (slot) => !isPersistentSlot(slot),
  );

  return sameKind ?? firstFreeNonPersistent ?? firstFree ?? firstNonPersistent;
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

export type ChatViewNavigation = {
  /** Release the binding held by `slot`. No-op for empty or persistent slots. */
  close: (slot: SlotName) => void;
  /** Hide `slot` without releasing its binding (subtree stays mounted). */
  hide: (slot: SlotName) => void;
  /**
   * Resolve a target slot for `binding` and bind it there. If no slot is
   * available the call is a rejected no-op (no view switch, no teardown).
   */
  open: (binding: ChatViewEntityBinding, options?: { slot?: SlotName }) => OpenResult;
  /** Switch the active view (channels/threads). */
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
      kind,
      requestedSlot,
      runtime,
      view,
    }: {
      kind: ChatViewEntityBinding['kind'];
      requestedSlot?: SlotName;
      runtime: ViewSlotRuntime;
      view: ChatView;
    }) => {
      // Preserve the public per-view resolver extension point (keyed on the
      // channel/thread actions) for the kinds that have one.
      const action =
        kind === 'channel' ? 'openChannel' : kind === 'thread' ? 'openThread' : undefined;
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
