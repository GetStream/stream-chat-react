import { getChatViewEntityBinding } from '../ChatView';
import { useLayoutViewState } from './useLayoutViewState';

import type { ChatViewEntityBinding } from '../ChatView';
import type { SlotName } from '../layoutController/layoutControllerTypes';

type SlotEntityKind = ChatViewEntityBinding['kind'];

type SlotEntitySourceMap = {
  [TKind in SlotEntityKind]: Extract<ChatViewEntityBinding, { kind: TKind }>['source'];
};

type SlotEntitySourceByKind<TKind extends SlotEntityKind> = SlotEntitySourceMap[TKind];

type UseSlotEntityOptions<TKind extends SlotEntityKind> = {
  /**
   * Entity kind to resolve from ChatView slot bindings.
   */
  kind: TKind;
  /**
   * Optional explicit slot to inspect.
   *
   * - when provided: only that slot is checked
   * - when omitted: slots are checked in active view order (`availableSlots`)
   */
  slot?: SlotName;
};

const resolveCandidateSlots = (
  slot: SlotName | undefined,
  availableSlots: SlotName[],
) => {
  if (slot) return [slot];
  return availableSlots;
};

const isEntityOfKind = <TKind extends SlotEntityKind>(
  entity: ChatViewEntityBinding | undefined,
  kind: TKind,
): entity is Extract<ChatViewEntityBinding, { kind: TKind }> => entity?.kind === kind;

/**
 * Resolves the `source` of the first matching ChatView entity binding.
 *
 * Behavior:
 * 1. Read active-view slot topology/bindings via `useLayoutViewState()`.
 * 2. Build candidate slots:
 *    - `[slot]` when explicit `slot` is provided
 *    - `availableSlots` order when `slot` is omitted
 * 3. Return `entity.source` for the first binding whose `kind` matches.
 * 4. Return `undefined` when no match exists.
 *
 * Why this exists:
 * - Keeps slot-to-entity lookup consistent and centralized for ChatView-aware
 *   components (e.g. `ChannelSlot`, `ThreadSlot`).
 * - Preserves type safety by narrowing returned `source` based on `kind`.
 *
 * @example
 * ```tsx
 * const channel = useSlotEntity({ kind: 'channel' });
 * // channel is Stream Channel | undefined
 * ```
 *
 * @example
 * ```tsx
 * const thread = useSlotEntity({ kind: 'thread', slot: 'main-thread' });
 * // thread is Thread | undefined from that slot only
 * ```
 *
 * @example
 * ```tsx
 * const list = useSlotEntity({ kind: 'channelList', slot: 'list' });
 * // list is { view?: ChatView } | undefined
 * ```
 */
export const useSlotEntity = <TKind extends SlotEntityKind>({
  kind,
  slot,
}: UseSlotEntityOptions<TKind>): SlotEntitySourceByKind<TKind> | undefined => {
  const { availableSlots, slotBindings } = useLayoutViewState();

  const candidateSlots = resolveCandidateSlots(slot, availableSlots);
  for (const candidateSlot of candidateSlots) {
    const entity = getChatViewEntityBinding(slotBindings[candidateSlot]);
    if (isEntityOfKind(entity, kind)) {
      // Safe due to discriminant check on `kind` above.
      return entity.source as SlotEntitySourceByKind<TKind>;
    }
  }

  return undefined;
};

/**
 * Convenience wrapper for `useSlotEntity({ kind: 'channel' })`.
 *
 * @example
 * ```tsx
 * const channel = useSlotChannel({ slot: 'main' });
 * ```
 */
export const useSlotChannel = (options?: { slot?: SlotName }) =>
  useSlotEntity({ kind: 'channel', slot: options?.slot });

/**
 * Convenience wrapper for `useSlotEntity({ kind: 'thread' })`.
 *
 * @example
 * ```tsx
 * const thread = useSlotThread();
 * ```
 */
export const useSlotThread = (options?: { slot?: SlotName }) =>
  useSlotEntity({ kind: 'thread', slot: options?.slot });
