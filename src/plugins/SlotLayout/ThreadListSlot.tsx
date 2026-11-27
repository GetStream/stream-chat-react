import React, { useEffect } from 'react';

import { createChatViewSlotBinding, getChatViewEntityBinding } from './slotBinding';
import { useChatViewContext } from './ChatView';
import { useLayoutViewState } from './hooks/useLayoutViewState';
import { Slot } from './layout/Slot';

import type { PropsWithChildren, ReactNode } from 'react';
import type {
  LayoutSlotBinding,
  SlotName,
} from './layoutController/layoutControllerTypes';

export type ThreadListSlotProps = PropsWithChildren<{
  /**
   * Rendered while the slot holds no thread list: when the layout has no slot for it, and until
   * the binding lands in a slot that does not hold one yet.
   */
  fallback?: ReactNode;
  /**
   * The slot to bind the thread list to. Without it, or when the layout has no such slot: the slot
   * already holding a thread list, else the first free slot, else the first slot, replacing what it
   * holds. Moving the list to `slot` empties the slot it held.
   */
  slot?: SlotName;
}>;

const LIST_BINDING_KEY = 'thread-list';
const LIST_ENTITY_KIND = 'threadList';

const isThreadListBinding = (binding?: LayoutSlotBinding) =>
  getChatViewEntityBinding(binding)?.kind === LIST_ENTITY_KIND;

/**
 * Binds a thread list into a layout slot and renders that slot. The slot shows `children` when
 * given, and otherwise the renderer registered for the `threadList` kind (`<ThreadList/>` unless
 * `ChatView`'s `slotRenderers` replace it).
 */
export const ThreadListSlot = ({ children, fallback, slot }: ThreadListSlotProps) => {
  const { layoutController } = useChatViewContext();
  const { availableSlots, slotBindings } = useLayoutViewState();

  const requestedSlot = slot && availableSlots.includes(slot) ? slot : undefined;
  const existingListSlot = availableSlots.find((candidate) =>
    isThreadListBinding(slotBindings[candidate]),
  );
  const firstFreeSlot = availableSlots.find((candidate) => !slotBindings[candidate]);
  const listSlot =
    requestedSlot ?? existingListSlot ?? firstFreeSlot ?? availableSlots[0];
  const isListBound = !!listSlot && isThreadListBinding(slotBindings[listSlot]);

  useEffect(() => {
    if (!listSlot) return;

    if (requestedSlot && existingListSlot && existingListSlot !== requestedSlot) {
      layoutController.release(existingListSlot);
    }

    if (isListBound) return;

    layoutController.bind(
      listSlot,
      createChatViewSlotBinding({
        key: LIST_BINDING_KEY,
        kind: LIST_ENTITY_KIND,
        source: {},
      }),
    );
  }, [existingListSlot, isListBound, layoutController, listSlot, requestedSlot]);

  if (!listSlot) return <>{fallback}</>;

  // `Slot` stays mounted while the list moves between slots. Until the list is bound, `false`
  // stands in for a missing `fallback` so the slot does not render what it held before.
  return <Slot slot={listSlot}>{isListBound ? children : (fallback ?? false)}</Slot>;
};
