/* eslint-disable sort-keys */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MuteChannelAPIResponse } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';

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
    // @ts-expect-error - restore original ResizeObserver after test
    delete window.ResizeObserver;
  });

  const setupTwoMemberGroupChannel = async (overrides?: {
    channelOverrides?: Record<string, unknown>;
    memberOverrides?: Array<Record<string, unknown>>;
  }) => {
    const { channels, client } = await initClientWithChannels({
      channelsData: [
        {
          channel: {
            id: 'two-member-group',
            member_count: 2,
            own_capabilities: ownCapabilities,
            ...overrides?.channelOverrides,
          },
          members: [
            generateMember({ user: alice, ...overrides?.memberOverrides?.[0] }),
            generateMember({ user: bob, ...overrides?.memberOverrides?.[1] }),
          ],
          messages: [],
        },
      ],
      customUser: alice,
    });
    const channel = channels[0];
    // Set membership so the filter recognizes the connected user as a member
    channel.state.membership = fromPartial({
      user: alice,
      user_id: alice.id,
    });
    return { channel, client };
  };

  const openDropdownMenu = () => {
    const toggle = screen.getByTestId('channel-list-item-dropdown-toggle');
    act(() => {
      fireEvent.click(toggle);
    });
  };

  // ---------- Mute / Unmute ----------

  describe('mute action', () => {
    it('mutes channel from quick action with success notification', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'mute').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      const muteButton = screen.getByTestId('quick-action-mute');
      act(() => {
        fireEvent.click(muteButton);
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

    it('shows error notification when mute fails', async () => {
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

      const muteButton = screen.getByTestId('quick-action-mute');
      act(() => {
        fireEvent.click(muteButton);
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

    it('unmutes a muted channel from quick action with success notification', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      // Simulate muted state by setting up the muteStatus
      vi.spyOn(channel, 'muteStatus').mockReturnValue(
        fromPartial({ muted: true, createdAt: new Date() }),
      );
      vi.spyOn(channel, 'unmute').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      const unmuteButton = screen.getByTestId('quick-action-mute');
      expect(unmuteButton).toHaveAttribute('aria-pressed', 'true');

      act(() => {
        fireEvent.click(unmuteButton);
      });

      await waitFor(() => {
        expect(channel.unmute).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Channel unmuted',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('shows error notification when unmute fails', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'muteStatus').mockReturnValue(
        fromPartial({ muted: true, createdAt: new Date() }),
      );
      vi.spyOn(channel, 'unmute').mockRejectedValueOnce(new Error('unmute failed'));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      const unmuteButton = screen.getByTestId('quick-action-mute');
      act(() => {
        fireEvent.click(unmuteButton);
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

    it('disables mute button while request is in progress', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      const p = Promise.withResolvers<MuteChannelAPIResponse>();
      vi.spyOn(channel, 'mute').mockReturnValue(p.promise);

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      const muteButton = screen.getByTestId('quick-action-mute');
      act(() => {
        fireEvent.click(muteButton);
      });

      await waitFor(() => {
        expect(muteButton).toBeDisabled();
      });

      act(() => {
        p.resolve(fromPartial({}));
      });

      await waitFor(() => {
        expect(muteButton).not.toBeDisabled();
      });
    });
  });

  // ---------- Block / Unblock ----------

  describe('block user action', () => {
    it('blocks the other member from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'banUser').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const blockButton = screen.getByTestId('dropdown-action-ban');
      act(() => {
        fireEvent.click(blockButton);
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

    it('unblocks a banned user from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel({
        memberOverrides: [undefined as never, { banned: true }],
      });
      vi.spyOn(channel, 'unbanUser').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const unblockButton = screen.getByTestId('dropdown-action-ban');
      expect(unblockButton).toHaveTextContent('Unblock User');

      act(() => {
        fireEvent.click(unblockButton);
      });

      await waitFor(() => {
        expect(channel.unbanUser).toHaveBeenCalledWith(bob.id);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'User unblocked',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('shows error notification when block fails', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'banUser').mockRejectedValueOnce(new Error('ban failed'));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const blockButton = screen.getByTestId('dropdown-action-ban');
      act(() => {
        fireEvent.click(blockButton);
      });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to block user',
            options: expect.objectContaining({ severity: 'error' }),
          }),
        );
      });
    });
  });

  // ---------- Leave channel ----------

  describe('leave channel action', () => {
    it('leaves channel from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'removeMembers').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const leaveButton = screen.getByTestId('dropdown-action-leave');
      act(() => {
        fireEvent.click(leaveButton);
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

    it('shows error notification when leave fails', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'removeMembers').mockRejectedValueOnce(new Error('leave failed'));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const leaveButton = screen.getByTestId('dropdown-action-leave');
      act(() => {
        fireEvent.click(leaveButton);
      });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to leave channel',
            options: expect.objectContaining({ severity: 'error' }),
          }),
        );
      });
    });
  });

  // ---------- Archive / Unarchive ----------

  describe('archive action', () => {
    it('archives channel from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'archive').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const archiveButton = screen.getByTestId('dropdown-action-archive');
      expect(archiveButton).toHaveTextContent('Archive');

      act(() => {
        fireEvent.click(archiveButton);
      });

      await waitFor(() => {
        expect(channel.archive).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Channel archived',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('unarchives an archived channel from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      // Simulate archived state
      channel.state.membership = fromPartial({
        ...channel.state.membership,
        archived_at: '2024-01-01T00:00:00Z',
      });
      vi.spyOn(channel, 'unarchive').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const unarchiveButton = screen.getByTestId('dropdown-action-archive');
      expect(unarchiveButton).toHaveTextContent('Unarchive');

      act(() => {
        fireEvent.click(unarchiveButton);
      });

      await waitFor(() => {
        expect(channel.unarchive).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Channel unarchived',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('shows error notification when archive fails', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'archive').mockRejectedValueOnce(new Error('archive failed'));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const archiveButton = screen.getByTestId('dropdown-action-archive');
      act(() => {
        fireEvent.click(archiveButton);
      });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to update channel archive status',
            options: expect.objectContaining({ severity: 'error' }),
          }),
        );
      });
    });
  });

  // ---------- Pin / Unpin ----------

  describe('pin action', () => {
    it('pins channel from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'pin').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const pinButton = screen.getByTestId('dropdown-action-pin');
      expect(pinButton).toHaveTextContent('Pin');

      act(() => {
        fireEvent.click(pinButton);
      });

      await waitFor(() => {
        expect(channel.pin).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Channel pinned',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('unpins a pinned channel from dropdown', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      // Simulate pinned state
      channel.state.membership = fromPartial({
        ...channel.state.membership,
        pinned_at: '2024-01-01T00:00:00Z',
      });
      vi.spyOn(channel, 'unpin').mockResolvedValue(fromPartial({}));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const unpinButton = screen.getByTestId('dropdown-action-pin');
      expect(unpinButton).toHaveTextContent('Unpin');

      act(() => {
        fireEvent.click(unpinButton);
      });

      await waitFor(() => {
        expect(channel.unpin).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Channel unpinned',
            options: expect.objectContaining({ severity: 'success' }),
          }),
        );
      });
    });

    it('shows error notification when pin fails', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();
      vi.spyOn(channel, 'pin').mockRejectedValueOnce(new Error('pin failed'));
      const addSpy = vi.spyOn(client.notifications, 'add');

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      openDropdownMenu();

      const pinButton = screen.getByTestId('dropdown-action-pin');
      act(() => {
        fireEvent.click(pinButton);
      });

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Failed to update channel pinned status',
            options: expect.objectContaining({ severity: 'error' }),
          }),
        );
      });
    });
  });

  // ---------- Action filtering ----------

  describe('action set filtering', () => {
    it('hides ban action when channel has more than 2 members', async () => {
      const charlie = generateUser({ id: 'charlie-id' });
      const { channels, client } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              id: 'three-member-group',
              member_count: 3,
              own_capabilities: ownCapabilities,
            },
            members: [
              generateMember({ user: alice }),
              generateMember({ user: bob }),
              generateMember({ user: charlie }),
            ],
            messages: [],
          },
        ],
        customUser: alice,
      });
      channels[0].state.membership = fromPartial({ user: alice, user_id: alice.id });

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channels[0]} />
          </Chat>,
        );
      });

      openDropdownMenu();

      expect(screen.queryByTestId('dropdown-action-ban')).not.toBeInTheDocument();
    });

    it('hides mute action when mute-channel capability is absent', async () => {
      const { channels, client } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              id: 'no-mute',
              member_count: 2,
              own_capabilities: ['leave-channel', 'ban-channel-members', 'send-message'],
            },
            members: [generateMember({ user: alice }), generateMember({ user: bob })],
            messages: [],
          },
        ],
        customUser: alice,
      });
      channels[0].state.membership = fromPartial({ user: alice, user_id: alice.id });

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channels[0]} />
          </Chat>,
        );
      });

      expect(screen.queryByTestId('quick-action-mute')).not.toBeInTheDocument();
    });

    it('hides leave action when leave-channel capability is absent', async () => {
      const { channels, client } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              id: 'no-leave',
              member_count: 2,
              own_capabilities: ['mute-channel', 'ban-channel-members', 'send-message'],
            },
            members: [generateMember({ user: alice }), generateMember({ user: bob })],
            messages: [],
          },
        ],
        customUser: alice,
      });
      channels[0].state.membership = fromPartial({ user: alice, user_id: alice.id });

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channels[0]} />
          </Chat>,
        );
      });

      openDropdownMenu();

      expect(screen.queryByTestId('dropdown-action-leave')).not.toBeInTheDocument();
    });

    it('hides ban action when user is not a channel member', async () => {
      const { channels, client } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              id: 'non-member',
              member_count: 2,
              own_capabilities: ownCapabilities,
            },
            members: [generateMember({ user: alice }), generateMember({ user: bob })],
            messages: [],
          },
        ],
        customUser: alice,
      });

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channels[0]} />
          </Chat>,
        );
      });

      openDropdownMenu();

      expect(screen.queryByTestId('dropdown-action-ban')).not.toBeInTheDocument();
    });

    it('hides ban action when ban-channel-members capability is absent', async () => {
      const { channels, client } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              id: 'no-ban',
              member_count: 2,
              own_capabilities: ['mute-channel', 'leave-channel', 'send-message'],
            },
            members: [generateMember({ user: alice }), generateMember({ user: bob })],
            messages: [],
          },
        ],
        customUser: alice,
      });
      channels[0].state.membership = fromPartial({ user: alice, user_id: alice.id });

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channels[0]} />
          </Chat>,
        );
      });

      openDropdownMenu();

      expect(screen.queryByTestId('dropdown-action-ban')).not.toBeInTheDocument();
    });
  });

  // ---------- Dropdown toggle ----------

  describe('dropdown toggle', () => {
    it('renders action buttons wrapper', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      expect(screen.getByTestId('channel-list-item-action-buttons')).toBeInTheDocument();
    });

    it('toggles dropdown menu open and closed', async () => {
      const { channel, client } = await setupTwoMemberGroupChannel();

      act(() => {
        render(
          <Chat client={client}>
            <ChannelListItem channel={channel} />
          </Chat>,
        );
      });

      const toggle = screen.getByTestId('channel-list-item-dropdown-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      act(() => {
        fireEvent.click(toggle);
      });

      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
      });

      act(() => {
        fireEvent.click(toggle);
      });

      await waitFor(() => {
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });
});
