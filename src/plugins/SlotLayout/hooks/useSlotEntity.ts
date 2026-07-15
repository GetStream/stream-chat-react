import { getChatViewEntityBinding } from '../ChatView';
import { useLayoutViewState } from './useLayoutViewState';

import type { ChatView, ChatViewEntityBinding } from '../ChatView';
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
  /**
   * Optional explicit view to read slots from.
   *
   * - when omitted: the **active** view's slots are read
   * - when provided: that view's slots are read regardless of which view is active
   *   (its layout state is retained across view switches). Useful for cross-view
   *   concerns like URL sync that must not clear when another view is focused.
   */
  view?: ChatView;
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
  view,
}: UseSlotEntityOptions<TKind>): SlotEntitySourceByKind<TKind> | undefined => {
  const { availableSlots, slotBindings } = useLayoutViewState(view);

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
 * Like {@link useSlotEntity}, but resolves the source of the **topmost layer** on a slot (the last
 * entry of `slotLayers[slot]`) rather than its base binding — when that layer's `kind` matches.
 *
 * Layers stack above the base binding and cover it while it stays mounted (see
 * `ChatViewNavigation.pushLayer`). Read the base with `useSlotEntity`/`useSlotChannel`/… and the
 * overlay on top with this hook, then render the overlay covering the base.
 *
 * @example
 * ```tsx
 * const profile = useSlotTopLayerEntity({ kind: 'userProfile', slot: 'main-thread' });
 * // profile is { userId } | undefined — present while a userProfile layer covers the slot
 * ```
 */
export const useSlotTopLayerEntity = <TKind extends SlotEntityKind>({
  kind,
  slot,
  view,
}: UseSlotEntityOptions<TKind>): SlotEntitySourceByKind<TKind> | undefined => {
  const { availableSlots, slotLayers } = useLayoutViewState(view);

  for (const candidateSlot of resolveCandidateSlots(slot, availableSlots)) {
    const layers = slotLayers?.[candidateSlot];
    const topBinding = layers?.[layers.length - 1];
    const entity = getChatViewEntityBinding(topBinding);
    if (isEntityOfKind(entity, kind)) {
      // Safe due to discriminant check on `kind` above.
      return entity.source as SlotEntitySourceByKind<TKind>;
    }
  }

  return undefined;
};

/**
 * Resolves **every** matching ChatView entity binding as `{ slot, source }` pairs
 * (in active-view `availableSlots` order, or only `slot` when provided).
 *
 * Prefer this over `useSlotEntity` when several slots can hold the same kind (e.g.
 * two channels side by side) — it never collapses the set to "the first match".
 *
 * @example
 * ```tsx
 * const channels = useSlotEntities({ kind: 'channel' });
 * // channels is Array<{ slot: SlotName; source: Channel }>
 * ```
 */
export const useSlotEntities = <TKind extends SlotEntityKind>({
  kind,
  slot,
  view,
}: UseSlotEntityOptions<TKind>): Array<{
  slot: SlotName;
  source: SlotEntitySourceByKind<TKind>;
}> => {
  const { availableSlots, slotBindings } = useLayoutViewState(view);

  return resolveCandidateSlots(slot, availableSlots).reduce<
    Array<{ slot: SlotName; source: SlotEntitySourceByKind<TKind> }>
  >((matches, candidateSlot) => {
    const entity = getChatViewEntityBinding(slotBindings[candidateSlot]);
    if (isEntityOfKind(entity, kind)) {
      // Safe due to discriminant check on `kind` above.
      matches.push({
        slot: candidateSlot,
        source: entity.source as SlotEntitySourceByKind<TKind>,
      });
    }
    return matches;
  }, []);
};

/**
 * Convenience wrapper for `useSlotEntity({ kind: 'channel' })` — the channel in a
 * single slot. Pass `slot` to be precise; omitting it returns the first channel slot
 * (only meaningful for a single-channel workspace). For multiple channels, use
 * `useSlotChannels`.
 *
 * @example
 * ```tsx
 * const channel = useSlotChannel({ slot: 'main' });
 * ```
 */
export const useSlotChannel = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntity({ kind: 'channel', slot: options?.slot, view: options?.view });

/**
 * Every slot currently holding a channel, as `{ channel, slot }` pairs. Robust for
 * side-by-side channels — the caller renders one panel per entry (and, for a
 * single-channel workspace, gets an array of length ≤ 1).
 *
 * @example
 * ```tsx
 * useSlotChannels().map(({ channel, slot }) => <ChannelPanel key={slot} channel={channel} />)
 * ```
 */
export const useSlotChannels = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntities({ kind: 'channel', slot: options?.slot, view: options?.view }).map(
    ({ slot, source }) => ({
      channel: source,
      slot,
    }),
  );

/**
 * Convenience wrapper for `useSlotEntity({ kind: 'thread' })`.
 *
 * @example
 * ```tsx
 * const thread = useSlotThread();
 * ```
 */
export const useSlotThread = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntity({ kind: 'thread', slot: options?.slot, view: options?.view });

/**
 * Every slot currently holding a thread, as `{ thread, slot }` pairs — the thread
 * analog of `useSlotChannels`. The caller renders one thread panel per entry.
 *
 * @example
 * ```tsx
 * useSlotThreads().map(({ thread, slot }) => (
 *   <ThreadProvider key={slot} thread={thread}><Thread /></ThreadProvider>
 * ))
 * ```
 */
export const useSlotThreads = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntities({ kind: 'thread', slot: options?.slot, view: options?.view }).map(
    ({ slot, source }) => ({
      slot,
      thread: source,
    }),
  );
