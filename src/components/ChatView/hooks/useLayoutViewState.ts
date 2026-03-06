import { useMemo } from 'react';

import { useStateStore } from '../../../store';
import type { ChatView } from '../ChatView';
import { useChatViewContext } from '../ChatView';
import type {
  ChatViewLayoutState,
  ChatViewLayoutViewState,
} from '../layoutController/layoutControllerTypes';

export const getLayoutViewState = (
  state: ChatViewLayoutState,
  view = state.activeView,
): ChatViewLayoutViewState => ({
  availableSlots: [...(state.availableSlotsByView?.[view] ?? [])],
  hiddenSlots: { ...(state.hiddenSlotsByView?.[view] ?? {}) },
  slotBindings: { ...(state.slotBindingsByView?.[view] ?? {}) },
  slotForwardHistory: { ...(state.slotForwardHistoryByView?.[view] ?? {}) },
  slotHistory: { ...(state.slotHistoryByView?.[view] ?? {}) },
  slotMeta: { ...(state.slotMetaByView?.[view] ?? {}) },
  slotNames: state.slotNamesByView?.[view]
    ? [...(state.slotNamesByView?.[view] ?? [])]
    : undefined,
});
export const useLayoutViewState = (view?: ChatView) => {
  const { layoutController } = useChatViewContext();
  const selector = useMemo(
    () => (state: Parameters<typeof getLayoutViewState>[0]) =>
      getLayoutViewState(state, view ?? state.activeView),
    [view],
  );

  return (
    useStateStore(layoutController.state, selector) ??
    selector(layoutController.state.getLatestValue())
  );
};
