import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import type { Channel } from 'stream-chat';

import { ChannelDetailProvider } from '../ChannelDetailContext';
import {
  type ChannelManagementActionItem,
  DefaultChannelManagementActions,
  defaultChannelManagementActionSet,
  useBaseChannelManagementActionSetFilter,
} from '../Views/ChannelManagementView/ChannelManagementActions.defaults';

const mocks = vi.hoisted(() => {
  const addNotification = vi.fn();
  const blockUser = vi.fn();
  const close = vi.fn();
  const deleteChannel = vi.fn();
  const mute = vi.fn();
  const muteUser = vi.fn();
  const removeMembers = vi.fn();
  const t = vi.fn((key: string) => key);
  const unBlockUser = vi.fn();
  const unmute = vi.fn();
  const unmuteUser = vi.fn();
  const blockedUsers = (() => {
    let currentValue = { userIds: [] as string[] };
    const listeners = new Set<() => void>();

    return {
      getLatestValue: () => currentValue,
      next: (nextValue: { userIds: string[] }) => {
        currentValue = nextValue;
        listeners.forEach((listener) => listener());
      },
      subscribeWithSelector: (
        _selector: (value: { userIds: string[] }) => Readonly<Record<string, unknown>>,
        listener: () => void,
      ) => {
        listeners.add(listener);

        return () => {
          listeners.delete(listener);
        };
      },
    };
  })();

  const channel = {
    data: {
      member_count: 2,
      members: [{ user: { id: 'own-user' } }, { user: { id: 'other-user' } }],
      own_capabilities: ['ban-channel-members', 'leave-channel', 'mute-channel'],
    },
    delete: deleteChannel,
    mute,
    removeMembers,
    state: {
      members: {
        'other-user': { user: { id: 'other-user' } },
        'own-user': { user: { id: 'own-user' } },
      },
    },
    unmute,
  };

  const client = {
    blockedUsers,
    blockUser,
    muteUser,
    unBlockUser,
    unmuteUser,
    user: { id: 'own-user' },
    userID: 'own-user',
  };

  return {
    addNotification,
    blockUser,
    channel,
    channelMuted: false,
    client,
    close,
    deleteChannel,
    mute,
    mutes: [] as Array<{ target: { id: string } }>,
    muteUser,
    removeMembers,
    t,
    unBlockUser,
    unmute,
    unmuteUser,
    useStableTranslationFunction: true,
  };
});

vi.mock('../../../context', () => ({
  useChatContext: () => ({
    client: mocks.client,
    mutes: mocks.mutes,
  }),
  useComponentContext: () => ({
    Modal: ({
      children,
      open,
      role,
    }: {
      children: React.ReactNode;
      open: boolean;
      role?: string;
    }) => (open ? <div role={role}>{children}</div> : null),
  }),
  useModalContext: () => ({ close: mocks.close }),
  useTranslationContext: () => ({
    t: mocks.useStableTranslationFunction ? mocks.t : (key: string) => mocks.t(key),
  }),
}));

vi.mock('../../../components/Notifications', () => ({
  useNotificationApi: () => ({
    addNotification: mocks.addNotification,
  }),
}));

vi.mock('../../../components/ChannelListItem/hooks/useIsChannelMuted', () => ({
  useIsChannelMuted: () => ({ muted: mocks.channelMuted }),
}));

const advanceDebounce = async () => {
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
};

const renderAction = (action: React.ReactElement) =>
  render(
    <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
      {action}
    </ChannelDetailProvider>,
  );

const PermissionProbe = ({
  actionSet = defaultChannelManagementActionSet,
}: {
  actionSet?: ChannelManagementActionItem[];
}) => {
  const filteredActions = useBaseChannelManagementActionSetFilter(actionSet);

  return (
    <>
      {filteredActions.map((action) => (
        <span data-testid='channel-management-action-type' key={action.type}>
          {action.type}
        </span>
      ))}
    </>
  );
};

const renderPermissionProbe = () =>
  render(
    <ChannelDetailProvider channel={mocks.channel as unknown as Channel}>
      <PermissionProbe />
    </ChannelDetailProvider>,
  );

const getRenderedActionTypes = () =>
  screen
    .queryAllByTestId('channel-management-action-type')
    .map((actionType) => actionType.textContent);

describe('DefaultChannelManagementActions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.addNotification.mockReset();
    mocks.blockUser.mockReset();
    mocks.close.mockReset();
    mocks.deleteChannel.mockReset();
    mocks.mute.mockReset();
    mocks.muteUser.mockReset();
    mocks.removeMembers.mockReset();
    mocks.t.mockClear();
    mocks.unBlockUser.mockReset();
    mocks.unmute.mockReset();
    mocks.unmuteUser.mockReset();
    mocks.useStableTranslationFunction = true;
    mocks.channelMuted = false;
    mocks.channel.data.member_count = 2;
    mocks.channel.data.members = [
      { user: { id: 'own-user' } },
      { user: { id: 'other-user' } },
    ];
    mocks.channel.data.own_capabilities = [
      'ban-channel-members',
      'leave-channel',
      'mute-channel',
    ];
    mocks.channel.state.members = {
      'other-user': { user: { id: 'other-user' } },
      'own-user': { user: { id: 'own-user' } },
    };
    mocks.client.blockedUsers.next({ userIds: [] });
    mocks.mutes = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('optimistically toggles channel mute and rolls back when the request fails', async () => {
    mocks.mute.mockRejectedValueOnce(new Error('mute failed'));

    renderAction(<DefaultChannelManagementActions.MuteChannel />);

    const muteButton = screen.getByRole('button', { name: 'Mute chat' });

    expect(muteButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(muteButton);

    expect(screen.getByRole('button', { name: 'Unmute chat' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(mocks.mute).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(mocks.mute).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Mute chat' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error muting channel',
        severity: 'error',
        type: 'api:channel:mute:failed',
      }),
    );
  });

  it('optimistically toggles user mute and rolls back when the request fails', async () => {
    mocks.muteUser.mockRejectedValueOnce(new Error('mute failed'));

    renderAction(<DefaultChannelManagementActions.MuteUser />);

    const muteButton = screen.getByRole('button', { name: 'Mute user' });

    expect(muteButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(muteButton);

    expect(screen.getByRole('button', { name: 'Unmute user' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(mocks.muteUser).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(mocks.muteUser).toHaveBeenCalledWith('other-user');
    expect(screen.getByRole('button', { name: 'Mute user' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error muting user',
        severity: 'error',
        type: 'api:user:mute:failed',
      }),
    );
  });

  it('keeps the pending user mute request after the optimistic rerender', async () => {
    mocks.muteUser.mockResolvedValueOnce(undefined);
    mocks.useStableTranslationFunction = false;
    const channelData = mocks.channel.data as {
      members?: typeof mocks.channel.data.members;
    };
    delete channelData.members;

    renderAction(<DefaultChannelManagementActions.MuteUser />);

    fireEvent.click(screen.getByRole('button', { name: 'Mute user' }));

    expect(screen.getByRole('button', { name: 'Unmute user' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(mocks.muteUser).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(mocks.muteUser).toHaveBeenCalledWith('other-user');
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User muted',
        severity: 'success',
        type: 'api:user:mute:success',
      }),
    );
  });

  it('opens a block user alert and runs the API from the confirm button', async () => {
    mocks.blockUser.mockResolvedValueOnce(undefined);

    renderAction(<DefaultChannelManagementActions.BlockUser />);

    fireEvent.click(screen.getByRole('button', { name: 'Block user' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Block User' })).toBeInTheDocument();
    expect(mocks.blockUser).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('channel-detail-block-user-alert-confirm-button'),
      );
      await Promise.resolve();
    });

    expect(mocks.blockUser).toHaveBeenCalledWith('other-user');
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User blocked',
        severity: 'success',
        type: 'api:user:block:success',
      }),
    );
  });

  it('opens an unblock user alert and runs the API from the confirm button', async () => {
    mocks.client.blockedUsers.next({ userIds: ['other-user'] });
    mocks.unBlockUser.mockResolvedValueOnce(undefined);

    renderAction(<DefaultChannelManagementActions.BlockUser />);

    fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Unblock' })).toBeInTheDocument();
    expect(mocks.unBlockUser).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('channel-detail-block-user-alert-confirm-button'),
      );
      await Promise.resolve();
    });

    expect(mocks.unBlockUser).toHaveBeenCalledWith('other-user');
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User unblocked',
        severity: 'success',
        type: 'api:user:unblock:success',
      }),
    );
  });

  it('opens a leave channel alert and runs the API from the confirm button', async () => {
    mocks.removeMembers.mockResolvedValueOnce(undefined);

    renderAction(<DefaultChannelManagementActions.LeaveChannel />);

    fireEvent.click(screen.getByRole('button', { name: 'Leave chat' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Leave chat' })).toBeInTheDocument();
    expect(mocks.removeMembers).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('channel-detail-leave-channel-alert-confirm-button'),
      );
      await Promise.resolve();
    });

    expect(mocks.removeMembers).toHaveBeenCalledWith(['own-user']);
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Left channel',
        severity: 'success',
        type: 'api:channel:leave:success',
      }),
    );
  });

  it('opens a delete chat alert and runs the API from the confirm button', async () => {
    mocks.deleteChannel.mockResolvedValueOnce(undefined);

    renderAction(<DefaultChannelManagementActions.DeleteChat />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete chat' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delete chat' })).toBeInTheDocument();
    expect(mocks.deleteChannel).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('channel-detail-delete-chat-alert-confirm-button'),
      );
      await Promise.resolve();
    });

    expect(mocks.deleteChannel).toHaveBeenCalledTimes(1);
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(mocks.addNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Chat deleted',
        severity: 'success',
        type: 'api:channel:delete:success',
      }),
    );
  });

  it('filters DM actions by channel capabilities', () => {
    mocks.channel.data.own_capabilities = ['ban-channel-members', 'mute-channel'];

    renderPermissionProbe();

    expect(getRenderedActionTypes()).toEqual([
      'muteChannel',
      'muteUser',
      'blockUser',
      'deleteChat',
    ]);
  });

  it('filters group actions by channel capabilities', () => {
    mocks.channel.data.member_count = 3;
    mocks.channel.data.members = [
      { user: { id: 'own-user' } },
      { user: { id: 'other-user' } },
      { user: { id: 'third-user' } },
    ];
    mocks.channel.state.members = {
      'other-user': { user: { id: 'other-user' } },
      'own-user': { user: { id: 'own-user' } },
      'third-user': { user: { id: 'third-user' } },
    };

    renderPermissionProbe();

    expect(getRenderedActionTypes()).toEqual([
      'muteChannel',
      'leaveChannel',
      'deleteChat',
    ]);
  });

  it('hides capability-gated group actions when capabilities are missing', () => {
    mocks.channel.data.member_count = 3;
    mocks.channel.data.own_capabilities = [];

    renderPermissionProbe();

    expect(getRenderedActionTypes()).toEqual(['deleteChat']);
  });
});
