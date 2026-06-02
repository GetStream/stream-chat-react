import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { DefaultChannelInfoActions } from '../Views/ChannelInfoActions.defaults';

const mocks = vi.hoisted(() => {
  const addNotification = vi.fn();
  const blockUser = vi.fn();
  const close = vi.fn();
  const mute = vi.fn();
  const muteUser = vi.fn();
  const removeMembers = vi.fn();
  const t = vi.fn((key: string) => key);
  const unmute = vi.fn();
  const unmuteUser = vi.fn();

  const channel = {
    data: {
      members: [{ user: { id: 'own-user' } }, { user: { id: 'other-user' } }],
      own_capabilities: ['ban-channel-members', 'leave-channel', 'mute-channel'],
    },
    mute,
    removeMembers,
    unmute,
  };

  const client = {
    blockUser,
    muteUser,
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
    mute,
    mutes: [] as Array<{ target: { id: string } }>,
    muteUser,
    removeMembers,
    t,
    unmute,
    unmuteUser,
  };
});

vi.mock('../../../context', () => ({
  useChannelStateContext: () => ({ channel: mocks.channel }),
  useChatContext: () => ({
    client: mocks.client,
    mutes: mocks.mutes,
  }),
  useModalContext: () => ({ close: mocks.close }),
  useTranslationContext: () => ({ t: mocks.t }),
}));

vi.mock('../../Notifications', () => ({
  useNotificationApi: () => ({
    addNotification: mocks.addNotification,
  }),
}));

vi.mock('../../ChannelListItem/hooks/useIsChannelMuted', () => ({
  useIsChannelMuted: () => ({ muted: mocks.channelMuted }),
}));

const advanceDebounce = async () => {
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
};

describe('DefaultChannelInfoActions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.addNotification.mockReset();
    mocks.blockUser.mockReset();
    mocks.close.mockReset();
    mocks.mute.mockReset();
    mocks.muteUser.mockReset();
    mocks.removeMembers.mockReset();
    mocks.t.mockClear();
    mocks.unmute.mockReset();
    mocks.unmuteUser.mockReset();
    mocks.channelMuted = false;
    mocks.mutes = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('optimistically toggles channel mute and rolls back when the request fails', async () => {
    mocks.mute.mockRejectedValueOnce(new Error('mute failed'));

    render(<DefaultChannelInfoActions.MuteChannel />);

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

    render(<DefaultChannelInfoActions.MuteUser />);

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
});
