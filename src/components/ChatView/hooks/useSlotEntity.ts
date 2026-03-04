import { getChatViewEntityBinding, useChatViewContext } from '../ChatView';
import { useStateStore } from '../../../store';

import type { ChatViewEntityBinding } from '../ChatView';
import type {
  ChatViewLayoutState,
  LayoutSlot,
} from '../layoutController/layoutControllerTypes';

type SlotEntityKind = ChatViewEntityBinding['kind'];

type SlotEntitySourceMap = {
  [TKind in SlotEntityKind]: Extract<ChatViewEntityBinding, { kind: TKind }>['source'];
};

type SlotEntitySourceByKind<TKind extends SlotEntityKind> = SlotEntitySourceMap[TKind];

type UseSlotEntityOptions<TKind extends SlotEntityKind> = {
  kind: TKind;
  slot?: LayoutSlot;
};

const slotEntitySelector = ({
  activeSlot,
  slotBindings,
  visibleSlots,
}: ChatViewLayoutState) => ({
  activeSlot,
  slotBindings,
  visibleSlots,
});

const resolveCandidateSlots = (
  activeSlot: LayoutSlot | undefined,
  slot: LayoutSlot | undefined,
  visibleSlots: LayoutSlot[],
) => {
  if (slot) return [slot];
  return Array.from(new Set([activeSlot, ...visibleSlots])).filter(
    (candidateSlot): candidateSlot is LayoutSlot => !!candidateSlot,
  );
};

const isEntityOfKind = <TKind extends SlotEntityKind>(
  entity: ChatViewEntityBinding | undefined,
  kind: TKind,
): entity is Extract<ChatViewEntityBinding, { kind: TKind }> => entity?.kind === kind;

export const useSlotEntity = <TKind extends SlotEntityKind>({
  kind,
  slot,
}: UseSlotEntityOptions<TKind>): SlotEntitySourceByKind<TKind> | undefined => {
  const { layoutController } = useChatViewContext();
  const { activeSlot, slotBindings, visibleSlots } =
    useStateStore(layoutController.state, slotEntitySelector) ??
    slotEntitySelector(layoutController.state.getLatestValue());

  const candidateSlots = resolveCandidateSlots(activeSlot, slot, visibleSlots);
  for (const candidateSlot of candidateSlots) {
    const entity = getChatViewEntityBinding(slotBindings[candidateSlot]);
    if (isEntityOfKind(entity, kind)) {
      // Safe due to discriminant check on `kind` above.
      return entity.source as SlotEntitySourceByKind<TKind>;
    }
  }

  return undefined;
};

export const useSlotChannel = (options?: { slot?: LayoutSlot }) =>
  useSlotEntity({ kind: 'channel', slot: options?.slot });

export const useSlotThread = (options?: { slot?: LayoutSlot }) =>
  useSlotEntity({ kind: 'thread', slot: options?.slot });
