import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { Chat } from '../../Chat';
import { ChannelListItem } from '../ChannelListItem';
import {
  generateMember,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { ResizeObserverMock } from '../../../mock-builders/browser';

const ResizeObserverConstructor =
  ResizeObserverMock as unknown as typeof window.ResizeObserver;

describe('ChannelListItemActionButtons defaults', () => {
  const alice = generateUser({ id: 'alice-id' });
  const bob = generateUser({ id: 'bob-id' });

  const ownCapabilities = [
    'ban-channel-members',
    'leave-channel',
    'mute-channel',
    'read-events',
    'send-message',
  ];

  beforeEach(() => {
    window.ResizeObserver = ResizeObserverConstructor;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete window.ResizeObserver;
  });

  const setupTwoMemberGroupChannel = async () => {
    const { channels, client } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            id: 'two-member-group',
            member_count: 2,
            own_capabilities: ownCapabilities,
          },
          members: [generateMember({ user: alice }), generateMember({ user: bob })],
          messages: [],
        },
      ],
      customUser: alice,
    });
    return { channel: channels[0], client };
  };

  it('mutes channel from quick action with success notification', async () => {
    const { channel, client } = await setupTwoMemberGroupChannel();
    vi.spyOn(channel, 'mute').mockResolvedValue(undefined);
    const addSpy = vi.spyOn(client.notifications, 'add');

    act(() => {
      render(
        <Chat client={client}>
          <ChannelListItem channel={channel} />
        </Chat>,
      );
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    });
    await waitFor(() => {
      expect(channel.mute).toHaveBeenCalledTimes(1);
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Channel muted',
          options: expect.objectContaining({ severity: 'success' }),
        }),
      );
    });
  });

  it('shows mute error notification when mute fails', async () => {
    const { channel, client } = await setupTwoMemberGroupChannel();
    vi.spyOn(channel, 'mute').mockRejectedValueOnce(new Error('mute failed'));
    const addSpy = vi.spyOn(client.notifications, 'add');

    act(() => {
      render(
        <Chat client={client}>
          <ChannelListItem channel={channel} />
        </Chat>,
      );
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    });

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update channel mute status',
          options: expect.objectContaining({ severity: 'error' }),
        }),
      );
    });
  });

  it('blocks the other member from dropdown', async () => {
    const { channel, client } = await setupTwoMemberGroupChannel();
    vi.spyOn(channel, 'banUser').mockResolvedValue(undefined);
    const addSpy = vi.spyOn(client.notifications, 'add');

    act(() => {
      render(
        <Chat client={client}>
          <ChannelListItem channel={channel} />
        </Chat>,
      );
    });

    const toggle = document.querySelector(
      '.str-chat__channel-list-item__action-buttons .str-chat__button--circular',
    ) as HTMLButtonElement;
    act(() => {
      fireEvent.click(toggle);
    });

    const menu = document.querySelector('.str-chat__context-menu') as HTMLElement;
    act(() => {
      fireEvent.click(within(menu).getByRole('button', { name: 'Block User' }));
    });

    await waitFor(() => {
      expect(channel.banUser).toHaveBeenCalledWith(bob.id, {});
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User blocked',
          options: expect.objectContaining({ severity: 'success' }),
        }),
      );
    });
  });

  it('leaves channel from dropdown', async () => {
    const { channel, client } = await setupTwoMemberGroupChannel();
    vi.spyOn(channel, 'removeMembers').mockResolvedValue(undefined);
    const addSpy = vi.spyOn(client.notifications, 'add');

    act(() => {
      render(
        <Chat client={client}>
          <ChannelListItem channel={channel} />
        </Chat>,
      );
    });

    const toggle = document.querySelector(
      '.str-chat__channel-list-item__action-buttons .str-chat__button--circular',
    ) as HTMLButtonElement;
    act(() => {
      fireEvent.click(toggle);
    });

    const menu = document.querySelector('.str-chat__context-menu') as HTMLElement;
    act(() => {
      fireEvent.click(within(menu).getByRole('button', { name: 'Leave Channel' }));
    });

    await waitFor(() => {
      expect(channel.removeMembers).toHaveBeenCalledWith([alice.id]);
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Left channel',
          options: expect.objectContaining({ severity: 'success' }),
        }),
      );
    });
  });
});
