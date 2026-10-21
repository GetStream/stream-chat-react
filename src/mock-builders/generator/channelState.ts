import { StateStore } from '@stream-io/state-store';
import { AIStates, ChannelWatchStatus } from 'stream-chat';
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
 * Builds a stand-in for `channel.state` for a partially-mocked (`fromPartial`) channel. It is a
 * real `StateStore<ChannelStateData>`, which hooks read through `useStateStore`, plus the
 * non-reactive getters (`members`, `read`, `typing`, ...) of the real `ChannelState`. Pass only the
 * slices a test needs, and drive reactivity with `partialNext()`.
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
