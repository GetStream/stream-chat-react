import { useLayoutViewState } from 'stream-chat-react/slot-layout';

/** Whether `slot` holds anything: a bound entity or a layer. */
export const useIsSlotOccupied = (slot: string) => {
  const { slotBindings, slotLayers } = useLayoutViewState();
  return !!slotBindings[slot] || !!slotLayers?.[slot]?.length;
};
