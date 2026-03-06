import React, { useEffect } from 'react';

import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from '../../ChatView';
import { useLayoutViewState } from '../../ChatView/hooks/useLayoutViewState';
import { Slot } from '../../ChatView/layout/Slot';

import type { PropsWithChildren, ReactNode } from 'react';
import type { ChatView } from '../../ChatView';
import type { SlotName } from '../../ChatView/layoutController/layoutControllerTypes';

export type ThreadListSlotProps = PropsWithChildren<{
  fallback?: ReactNode;
  slot?: SlotName;
}>;

const LIST_BINDING_KEY = 'thread-list';
const LIST_ENTITY_KIND = 'threadList';

const registerListSlotHint = (
  view: ChatView,
  slot: SlotName,
  state: ReturnType<typeof useChatViewContext>['layoutController']['state'],
) => {
  state.next((current) => {
    if (current.listSlotByView?.[view] === slot) return current;

    return {
      ...current,
      listSlotByView: {
        ...(current.listSlotByView ?? {}),
        [view]: slot,
      },
    };
  });
};

export const ThreadListSlot = ({
  children,
  fallback = null,
  slot,
}: ThreadListSlotProps) => {
  const { activeView, layoutController } = useChatViewContext();
  const { availableSlots, slotBindings } = useLayoutViewState();

  const requestedSlot = slot && availableSlots.includes(slot) ? slot : undefined;
  const existingListSlot = availableSlots.find(
    (candidate) =>
      getChatViewEntityBinding(slotBindings[candidate])?.kind === LIST_ENTITY_KIND,
  );
  const firstFreeSlot = availableSlots.find((candidate) => !slotBindings[candidate]);
  const listSlot =
    requestedSlot ?? existingListSlot ?? firstFreeSlot ?? availableSlots[0];

  useEffect(() => {
    if (!listSlot) return;

    registerListSlotHint(activeView, listSlot, layoutController.state);

    if (requestedSlot && existingListSlot && existingListSlot !== requestedSlot) {
      layoutController.clear(existingListSlot);
    }

    const existingEntity = getChatViewEntityBinding(slotBindings[listSlot]);
    if (
      existingEntity?.kind === LIST_ENTITY_KIND &&
      existingEntity.source.view === activeView
    ) {
      return;
    }

    layoutController.setSlotBinding(
      listSlot,
      createChatViewSlotBinding({
        key: LIST_BINDING_KEY,
        kind: LIST_ENTITY_KIND,
        source: { view: activeView },
      }),
    );
  }, [
    activeView,
    existingListSlot,
    layoutController,
    listSlot,
    requestedSlot,
    slotBindings,
  ]);

  if (!listSlot) return <>{fallback}</>;

  return <Slot slot={listSlot}>{children ?? fallback}</Slot>;
};
