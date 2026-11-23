import { act, render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, MembersState, UserSearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';

import { ChannelDetailProvider } from '../../../ChannelDetailContext';

type ChannelMembersTestState = Pick<MembersState, 'memberCount' | 'members'>;

// The parts of `ChannelState` the members views read: a store, plus the `members` getter.
class ChannelMembersTestStateStore extends StateStore<ChannelMembersTestState> {
  get members() {
    return this.getLatestValue().members;
  }
}

/** Changes the channel's members state the way the SDK does on membership events. */
export const updateChannelMembersState = (
  channel: Channel,
  next: Partial<ChannelMembersTestState>,
) =>
  act(() => {
    (channel.state as unknown as ChannelMembersTestStateStore).partialNext(next);
  });

/**
 * For test files that auto-mock the `store` module: `useStateStore` reads a channel's state store
 * for real, so membership changes re-render, and returns `otherStoresValue` for any other store.
 */
export const mockUseStateStoreForChannel = async (otherStoresValue: unknown) => {
  const store =
    await vi.importActual<typeof import('../../../../../store')>('../../../../../store');
  const { useStateStore } = await import('../../../../../store');

  vi.mocked(useStateStore).mockImplementation(((
    stateStore: unknown,
    selector: (value: unknown) => unknown,
  ) =>
    stateStore instanceof ChannelMembersTestStateStore
      ? store.useStateStore(stateStore, selector as never)
      : otherStoresValue) as typeof useStateStore);
};

const MEMBER_LIST_ITEM_CLASS =
  'str-chat__channel-detail__channel-members-view__list-item';

export const getSelectableMemberButton = (displayName: string) => {
  const button = screen
    .getAllByRole('button', { name: new RegExp(displayName) })
    .find((element) => element.classList.contains(MEMBER_LIST_ITEM_CLASS));

  if (!button) {
    throw new Error(`Selectable member button not found for "${displayName}"`);
  }

  return button;
};

export const querySelectableMemberButton = (displayName: string) =>
  screen
    .queryAllByRole('button', { name: new RegExp(displayName) })
    .find((element) => element.classList.contains(MEMBER_LIST_ITEM_CLASS)) ?? null;

export const createChannel = (
  overrides: {
    memberCount?: number;
    members?: MembersState['members'];
    ownCapabilities?: string[];
  } = {},
) => {
  const state = new ChannelMembersTestStateStore({
    memberCount: overrides.memberCount ?? 2,
    members:
      overrides.members ??
      fromPartial<MembersState['members']>({
        'user-1': {
          user: { id: 'user-1', name: 'Alice' },
          user_id: 'user-1',
        },
      }),
  });

  return fromPartial<Channel>({
    addMembers: vi.fn().mockResolvedValue({}),
    data: {
      // Mirrors the state, as `channel.data` does in the SDK.
      get member_count() {
        return state.getLatestValue().memberCount;
      },
      own_capabilities: overrides.ownCapabilities ?? ['update-channel-members'],
    },
    removeMembers: vi.fn().mockResolvedValue({}),
    state: state as unknown as Channel['state'],
  });
};

export const renderWithChannel = (
  ui: React.ReactElement,
  channel: Channel = createChannel(),
) => render(<ChannelDetailProvider channel={channel}>{ui}</ChannelDetailProvider>);

export const createUserSearchSource = () => {
  const search = vi.fn();
  const activate = vi.fn();
  const cancelScheduledQuery = vi.fn();

  return {
    activate,
    cancelScheduledQuery,
    search,
    searchSource: fromPartial<UserSearchSource>({
      activate,
      cancelScheduledQuery,
      search,
      state: {},
    }),
  };
};
