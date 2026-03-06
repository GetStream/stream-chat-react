import React, { createContext, useContext, useMemo } from 'react';

import { useChatContext } from '../../context';
import { useStateStore } from '../../store';
import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from './ChatView';

import type { PropsWithChildren } from 'react';
import type {
  LocalMessage,
  Channel as StreamChannel,
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

const LIST_BINDING_KEYS: Record<ChatView, string> = {
  channels: 'list',
  threads: 'thread-list',
};
const LIST_ENTITY_KIND_BY_VIEW = {
  channels: 'channelList',
  threads: 'threadList',
} as const satisfies Record<ChatView, 'channelList' | 'threadList'>;

type ViewSlotRuntime = {
  activeViewState: ChatViewLayoutViewState;
  availableSlots: SlotName[];
  listEntityKind: (typeof LIST_ENTITY_KIND_BY_VIEW)[ChatView];
  listSlotHint?: SlotName;
  orderedSlots: SlotName[];
  slotBindings: Record<SlotName, LayoutSlotBinding | undefined>;
};

const resolveGeneratedSlots = (slotCount: number): SlotName[] =>
  Array.from(
    { length: Math.max(0, slotCount) },
    (_, index) => `slot${index + 1}` as SlotName,
  );

const resolveDefaultTargetSlot = ({
  action,
  requestedSlot,
  runtime,
  view,
}: {
  action: 'openChannel' | 'openThread';
  runtime: ViewSlotRuntime;
  requestedSlot?: SlotName;
  view: ChatView;
}): SlotName | undefined => {
  if (requestedSlot && runtime.availableSlots.includes(requestedSlot)) {
    return requestedSlot;
  }

  const readSlotKind = (slot: SlotName) =>
    getChatViewEntityBinding(runtime.activeViewState.slotBindings[slot])?.kind;
  const isListSlot = (slot: SlotName) =>
    slot === runtime.listSlotHint || readSlotKind(slot) === runtime.listEntityKind;
  const findNamed = (...names: SlotName[]) =>
    names.find((name) => runtime.orderedSlots.includes(name));
  const firstFree = runtime.availableSlots.find((slot) => !runtime.slotBindings[slot]);
  const firstFreeNonList = runtime.availableSlots.find(
    (slot) => !runtime.slotBindings[slot] && !isListSlot(slot),
  );
  const firstNonList = runtime.availableSlots.find((slot) => !isListSlot(slot));
  const firstThread = runtime.availableSlots.find(
    (slot) => readSlotKind(slot) === 'thread',
  );
  const firstChannel = runtime.availableSlots.find(
    (slot) => readSlotKind(slot) === 'channel',
  );

  if (action === 'openThread') {
    return (
      firstThread ??
      (view === 'channels' ? findNamed('thread') : findNamed('main-thread', 'thread')) ??
      firstFreeNonList ??
      firstFree ??
      firstChannel ??
      firstNonList ??
      runtime.availableSlots[runtime.availableSlots.length - 1]
    );
  }

  return (
    firstChannel ??
    findNamed('main', 'channel') ??
    firstFreeNonList ??
    firstFree ??
    firstNonList ??
    runtime.availableSlots[runtime.availableSlots.length - 1]
  );
};

export type OpenThreadTarget =
  | StreamThread
  | { channel: StreamChannel; message: LocalMessage };

export type ChatViewNavigation = {
  closeChannel: (options?: { slot?: SlotName }) => void;
  closeThread: (options?: { slot?: SlotName }) => void;
  hideChannelList: (options?: { slot?: SlotName }) => void;
  openChannel: (channel: StreamChannel, options?: { slot?: SlotName }) => OpenResult;
  openThread: (
    threadOrTarget: OpenThreadTarget,
    options?: { slot?: SlotName },
  ) => OpenResult;
  openView: (view: ChatView, options?: { slot?: SlotName }) => void;
  unhideChannelList: (options?: { slot?: SlotName }) => void;
};

const chatViewNavigationStateSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
  listSlotByView: state.listSlotByView,
});

const ChatViewNavigationContext = createContext<ChatViewNavigation>({
  closeChannel: () => undefined,
  closeThread: () => undefined,
  hideChannelList: () => undefined,
  openChannel: () => ({ reason: 'no-available-slot', status: 'rejected' }),
  openThread: () => ({ reason: 'no-available-slot', status: 'rejected' }),
  openView: () => undefined,
  unhideChannelList: () => undefined,
});

export const useChatViewNavigation = () => useContext(ChatViewNavigationContext);

export const ChatViewNavigationProvider = ({ children }: PropsWithChildren) => {
  const { layoutController, resolveActionTargetSlot } = useChatViewContext();
  const { client } = useChatContext();
  const { availableSlots, slotBindings } = useLayoutViewState();
  const { activeView, listSlotByView } =
    useStateStore(layoutController.state, chatViewNavigationStateSelector) ??
    chatViewNavigationStateSelector(layoutController.state.getLatestValue());

  const value = useMemo<ChatViewNavigation>(() => {
    const listBindingKey = LIST_BINDING_KEYS[activeView];
    const listEntityKind = LIST_ENTITY_KIND_BY_VIEW[activeView];

    const findCandidateSlotsByKind = (kind: ChatViewEntityBinding['kind']) =>
      availableSlots.filter(
        (slot) => getChatViewEntityBinding(slotBindings[slot])?.kind === kind,
      );

    const resolveListSlotHint = () => listSlotByView?.[activeView];
    const resolveDeterministicSlot = (candidates: SlotName[]) =>
      candidates.length === 1 ? candidates[0] : undefined;
    const resolveSlot = ({
      fallbackSlots = [],
      kind,
      slot,
    }: {
      fallbackSlots?: SlotName[];
      kind?: ChatViewEntityBinding['kind'];
      slot?: SlotName;
    }) => {
      if (slot) return availableSlots.includes(slot) ? slot : undefined;

      if (kind) {
        const kindSlot = resolveDeterministicSlot(findCandidateSlotsByKind(kind));
        if (kindSlot) return kindSlot;
      }

      return resolveDeterministicSlot(fallbackSlots);
    };

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
        listEntityKind: LIST_ENTITY_KIND_BY_VIEW[view],
        listSlotHint: state.listSlotByView?.[view],
        orderedSlots: viewState.slotNames?.length
          ? viewState.slotNames
          : resolveGeneratedSlots(inferredMaxSlots),
        slotBindings: viewState.slotBindings,
      };
    };
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
    const resolveActionSlot = ({
      action,
      requestedSlot,
      runtime,
      view,
    }: {
      action: 'openChannel' | 'openThread';
      requestedSlot?: SlotName;
      runtime: ViewSlotRuntime;
      view: ChatView;
    }) => {
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
        const materializedCustomSlot = materializeTargetSlot(runtime, customTargetSlot);
        if (materializedCustomSlot) return materializedCustomSlot;
      }

      return materializeTargetSlot(
        runtime,
        resolveDefaultTargetSlot({
          action,
          requestedSlot,
          runtime,
          view,
        }),
      );
    };

    const openView: ChatViewNavigation['openView'] = (view, options) => {
      layoutController.openView(view, { slot: options?.slot });
    };

    const clearThreadSlots = ({ slot }: { slot?: SlotName } = {}) => {
      const explicitSlot = slot && availableSlots.includes(slot) ? slot : undefined;
      const threadSlots = findCandidateSlotsByKind('thread');

      if (explicitSlot) {
        layoutController.clear(explicitSlot);
        return;
      }

      if (threadSlots.length === 1) {
        layoutController.clear(threadSlots[0]);
        return;
      }

      threadSlots.forEach((threadSlot) => layoutController.clear(threadSlot));
    };

    const closeThread: ChatViewNavigation['closeThread'] = (options) => {
      clearThreadSlots({ slot: options?.slot });
    };

    const openChannel: ChatViewNavigation['openChannel'] = (channel, options) => {
      closeThread();
      openView('channels', options);
      const runtime = buildRuntimeForView('channels');
      const targetSlot = resolveActionSlot({
        action: 'openChannel',
        requestedSlot: options?.slot,
        runtime,
        view: 'channels',
      });

      return layoutController.openInLayout(
        createChatViewSlotBinding({
          key: channel.cid ?? undefined,
          kind: 'channel',
          source: channel,
        }),
        {
          targetSlot,
        },
      );
    };

    const closeChannel: ChatViewNavigation['closeChannel'] = (options) => {
      const targetSlot = resolveSlot({ kind: 'channel', slot: options?.slot });
      if (!targetSlot) return;
      layoutController.goBack(targetSlot);
    };

    const openThreadInSlot = (
      thread: StreamThread,
      options?: { slot?: SlotName },
    ): OpenResult =>
      layoutController.openInLayout(
        createChatViewSlotBinding({
          key: thread.id ?? undefined,
          kind: 'thread',
          source: thread,
        }),
        {
          targetSlot: options?.slot,
        },
      );

    const openThread: ChatViewNavigation['openThread'] = (threadOrTarget, options) => {
      const runtime = buildRuntimeForView(activeView);
      const targetSlot = resolveActionSlot({
        action: 'openThread',
        requestedSlot: options?.slot,
        runtime,
        view: activeView,
      });

      if ('channel' in threadOrTarget && 'message' in threadOrTarget) {
        const existingThread = client.threads.threadsById[threadOrTarget.message.id];
        const thread =
          existingThread ??
          new StreamThreadClass({
            channel: threadOrTarget.channel,
            client,
            parentMessage: threadOrTarget.message,
          });

        return openThreadInSlot(thread, { slot: targetSlot });
      }

      return openThreadInSlot(threadOrTarget, { slot: targetSlot });
    };

    const hideChannelList: ChatViewNavigation['hideChannelList'] = (options) => {
      const targetSlot =
        options?.slot ??
        resolveListSlotHint() ??
        resolveSlot({
          fallbackSlots: availableSlots,
          kind: listEntityKind,
          slot: options?.slot,
        });
      if (targetSlot) {
        layoutController.hide(targetSlot);
      }
    };

    const unhideChannelList: ChatViewNavigation['unhideChannelList'] = (options) => {
      const existingListSlot = resolveSlot({ kind: listEntityKind });
      const targetSlot =
        options?.slot ??
        resolveListSlotHint() ??
        resolveSlot({ fallbackSlots: availableSlots, slot: options?.slot }) ??
        existingListSlot ??
        resolveDeterministicSlot(availableSlots);

      if (targetSlot) {
        if (!existingListSlot) {
          layoutController.setSlotBinding(
            targetSlot,
            createChatViewSlotBinding({
              key: listBindingKey,
              kind: listEntityKind,
              source: { view: activeView },
            }),
          );
        }

        layoutController.unhide(targetSlot);
      }
    };

    return {
      closeChannel,
      closeThread,
      hideChannelList,
      openChannel,
      openThread,
      openView,
      unhideChannelList,
    };
  }, [
    activeView,
    availableSlots,
    client,
    listSlotByView,
    layoutController,
    resolveActionTargetSlot,
    slotBindings,
  ]);

  return (
    <ChatViewNavigationContext.Provider value={value}>
      {children}
    </ChatViewNavigationContext.Provider>
  );
};
