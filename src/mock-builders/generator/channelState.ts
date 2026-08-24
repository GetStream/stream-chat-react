import { AIStates, ChannelWatchStatus, StateStore } from 'stream-chat';
import type { ChannelMemberResponse, ChannelState, ChannelStateData } from 'stream-chat';

/** The non-reactive convenience getters the real `ChannelState` layers over its own store. */
type ChannelStateGetters = Pick<
  ChannelState,
  | 'member_count'
  | 'members'
  | 'membership'
  | 'read'
  | 'typing'
  | 'watcher_count'
  | 'watchers'
>;

export type MockChannelState = StateStore<ChannelStateData> & ChannelStateGetters;

/**
 * Builds a stand-in for `channel.state` to hand to a partially-mocked (`fromPartial`) channel.
 *
 * `channel.state` IS a `StateStore<ChannelStateData>` now, so hooks reading it go through
 * `useStateStore` and call `getLatestValue()` / `subscribeWithSelector()` on it — a plain-object
 * mock crashes with `getLatestValue is not a function`. This returns a real store, plus the
 * non-reactive convenience getters (`members`, `read`, `typing`, …) the real `ChannelState`
 * exposes, so code reading a slice directly rather than through a selector sees the same value.
 *
 * Only pass the slices a test cares about; the rest get the defaults `ChannelState` seeds. Drive
 * reactivity with `partialNext()`.
 */
export const generateChannelState = (
  overrides: Partial<ChannelStateData> = {},
): MockChannelState => {
  const store = new StateStore<ChannelStateData>({
    active: false,
    aiState: AIStates.Idle,
    data: undefined,
    initialized: false,
    memberCount: 0,
    members: {},
    membership: {} as ChannelMemberResponse,
    muteStatus: { createdAt: null, expiresAt: null, muted: false },
    offlineMode: false,
    ownCapabilities: [],
    pendingDisposal: false,
    read: {},
    typing: {},
    watcherCount: 0,
    watchers: {},
    watchStatus: ChannelWatchStatus.NotWatching,
    ...overrides,
  });

  const getter = <K extends keyof ChannelStateData>(key: K) => ({
    configurable: true,
    get: () => store.getLatestValue()[key],
  });

  return Object.defineProperties(store, {
    member_count: getter('memberCount'),
    members: getter('members'),
    membership: getter('membership'),
    read: getter('read'),
    typing: getter('typing'),
    watcher_count: getter('watcherCount'),
    watchers: getter('watchers'),
  }) as MockChannelState;
};
