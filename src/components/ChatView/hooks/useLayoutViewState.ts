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
): ChatViewLayoutViewState => {
  const layout = state.layouts?.[view];
  return {
    availableSlots: [...(layout?.availableSlots ?? [])],
    hiddenSlots: { ...(layout?.hiddenSlots ?? {}) },
    slotBindings: { ...(layout?.slotBindings ?? {}) },
    slotForwardHistory: { ...(layout?.slotForwardHistory ?? {}) },
    slotHistory: { ...(layout?.slotHistory ?? {}) },
    slotLayers: { ...(layout?.slotLayers ?? {}) },
    slotMeta: { ...(layout?.slotMeta ?? {}) },
    slotNames: layout?.slotNames ? [...layout.slotNames] : undefined,
  };
};
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
