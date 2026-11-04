import { useEffect } from 'react';
import {
  getLayoutViewState,
  useChatViewContext,
  useLayoutViewState,
} from 'stream-chat-react/slot-layout';
import type { ChatViewLayoutViewState } from 'stream-chat-react/slot-layout';

// How many steps are open in the "main" slot: what it holds, and what's on top.
const stepsOpen = ({ slotBindings, slotLayers }: ChatViewLayoutViewState) =>
  (slotBindings.main ? 1 : 0) + (slotLayers?.main?.length ?? 0);

// The steps the current history entry was added for.
const stepsInHistory = () =>
  (window.history.state as { steps?: number } | null)?.steps ?? 0;

export const BrowserBack = () => {
  const { layoutController } = useChatViewContext();
  const steps = stepsOpen(useLayoutViewState());

  // A step opened: add an entry. Steps closed from the header: drop their entries.
  useEffect(() => {
    const inHistory = stepsInHistory();
    if (steps > inHistory) window.history.pushState({ steps }, '');
    else if (steps < inHistory) window.history.go(steps - inHistory);
  }, [steps]);

  // The browser went back: close the top step.
  useEffect(() => {
    const onPopState = () => {
      const view = getLayoutViewState(layoutController.state.getLatestValue());
      if (stepsOpen(view) <= stepsInHistory()) return;
      if (view.slotLayers?.main?.length) layoutController.popLayer('main');
      else layoutController.release('main');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [layoutController]);

  return null;
};
