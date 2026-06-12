import { render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, UserSearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChannelDetailProvider } from '../../../ChannelDetailContext';

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
    members?: Channel['state']['members'];
    ownCapabilities?: string[];
  } = {},
) =>
  fromPartial<Channel>({
    addMembers: vi.fn().mockResolvedValue({}),
    data: {
      member_count: 2,
      own_capabilities: overrides.ownCapabilities ?? ['update-channel-members'],
    },
    removeMembers: vi.fn().mockResolvedValue({}),
    state: {
      members: overrides.members ?? {
        'user-1': {
          user: { id: 'user-1', name: 'Alice' },
          user_id: 'user-1',
        },
      },
    },
  });

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
