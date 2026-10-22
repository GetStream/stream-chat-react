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
  /** Entity kind to resolve from the slot bindings. */
  kind: TKind;
  /** Only this slot is checked. Defaults to every slot of the view, in `availableSlots` order. */
  slot?: SlotName;
  /**
   * View whose slots are read, even when another view is active. Defaults to the active view.
   * Needed by state that must not clear on a view switch, such as URL sync.
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
 * Resolves the `source` of the first slot binding of the given kind, or `undefined` when none
 * matches.
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
 * // list is Record<string, never> | undefined
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
 * Like {@link useSlotEntity}, but resolves the source of the topmost layer of a slot (the last
 * entry of `slotLayers[slot]`) instead of its base binding, when that layer's `kind` matches.
 *
 * A layer never replaces the base binding, which {@link useSlotEntity} keeps returning.
 *
 * @example
 * ```tsx
 * const profile = useSlotTopLayerEntity({ kind: 'userProfile', slot: 'main-thread' });
 * // profile is { userId } | undefined, present while a userProfile layer covers the slot
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
 * Resolves every slot binding of the given kind as `{ slot, source }` pairs, in `availableSlots`
 * order.
 *
 * Prefer it over `useSlotEntity` when several slots can hold the same kind, such as two channels
 * side by side.
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
 * The channel in `slot`. Without `slot` it is the channel of the first slot holding one, which only
 * suits a single-channel workspace; use {@link useSlotChannels} for several.
 *
 * @example
 * ```tsx
 * const channel = useSlotChannel({ slot: 'main' });
 * ```
 */
export const useSlotChannel = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntity({ kind: 'channel', slot: options?.slot, view: options?.view });

/**
 * Every slot currently holding a channel, as `{ channel, slot }` pairs: one panel to render per
 * entry.
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
 * The thread in `slot`, or in the first slot holding one when `slot` is omitted.
 *
 * @example
 * ```tsx
 * const thread = useSlotThread();
 * ```
 */
export const useSlotThread = (options?: { slot?: SlotName; view?: ChatView }) =>
  useSlotEntity({ kind: 'thread', slot: options?.slot, view: options?.view });

/**
 * Every slot currently holding a thread, as `{ thread, slot }` pairs: one panel to render per
 * entry.
 *
 * @example
 * ```tsx
 * useSlotThreads().map(({ thread, slot }) => (
 *   <Thread key={slot} thread={thread}><ThreadHeader /><MessageList /></Thread>
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
