import { useLayoutViewState } from 'stream-chat-react/slot-layout';

/** Whether something sits beneath what `slot` shows on top: its base or another layer. */
export const useHasContentBeneath = (slot: string) => {
  const { slotBindings, slotLayers } = useLayoutViewState();
  return (slotLayers?.[slot]?.length ?? 0) + (slotBindings[slot] ? 1 : 0) > 1;
};
