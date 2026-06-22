import { act, render, screen } from '@testing-library/react';
import React from 'react';
import type { Channel, UserSearchSource } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

import { ChannelDetailProvider } from '../../../ChannelDetailContext';

type ChannelEventHandler = (event?: unknown) => void;

// Maps a mock channel to the handlers registered via `channel.on(...)`, so tests
// can simulate membership events with `emitChannelEvent` without leaking the
// registry onto the typed Channel shape.
const channelEventHandlers = new WeakMap<
  Channel,
  Record<string, ChannelEventHandler[]>
>();

export const emitChannelEvent = (channel: Channel, event: string) =>
  act(() => {
    channelEventHandlers.get(channel)?.[event]?.forEach((handler) => handler());
  });

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
    members?: Channel['state']['members'];
    ownCapabilities?: string[];
  } = {},
) => {
  const handlers: Record<string, ChannelEventHandler[]> = {};

  const channel = fromPartial<Channel>({
    addMembers: vi.fn().mockResolvedValue({}),
    data: {
      member_count: overrides.memberCount ?? 2,
      own_capabilities: overrides.ownCapabilities ?? ['update-channel-members'],
    },
    on: vi.fn((event: string, handler: ChannelEventHandler) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
      return { unsubscribe: vi.fn() };
    }),
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

  channelEventHandlers.set(channel, handlers);

  return channel;
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
