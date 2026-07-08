import React, { useEffect } from 'react';

import {
  createChatViewSlotBinding,
  getChatViewEntityBinding,
  useChatViewContext,
} from '../../ChatView';
import { useLayoutViewState } from '../../ChatView/hooks/useLayoutViewState';
import { Slot } from '../../ChatView/layout/Slot';

import type { PropsWithChildren, ReactNode } from 'react';
import type { SlotName } from '../../ChatView/layoutController/layoutControllerTypes';

export type ThreadListSlotProps = PropsWithChildren<{
  fallback?: ReactNode;
  slot?: SlotName;
}>;

const LIST_BINDING_KEY = 'thread-list';
const LIST_ENTITY_KIND = 'threadList';

export const ThreadListSlot = ({
  children,
  fallback = null,
  slot,
}: ThreadListSlotProps) => {
  const { layoutController } = useChatViewContext();
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

    if (requestedSlot && existingListSlot && existingListSlot !== requestedSlot) {
      layoutController.release(existingListSlot);
    }

    const existingEntity = getChatViewEntityBinding(slotBindings[listSlot]);
    if (existingEntity?.kind === LIST_ENTITY_KIND) {
      return;
    }

    layoutController.bind(
      listSlot,
      createChatViewSlotBinding({
        key: LIST_BINDING_KEY,
        kind: LIST_ENTITY_KIND,
        source: {},
      }),
    );
  }, [existingListSlot, layoutController, listSlot, requestedSlot, slotBindings]);

  if (!listSlot) return <>{fallback}</>;

  return <Slot slot={listSlot}>{children ?? fallback}</Slot>;
};
