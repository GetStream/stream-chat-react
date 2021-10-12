import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { useUserRole } from '../useUserRole';

import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

const getConfig = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUserRoleHook(
  message = generateMessage(),
  channelProps,
  channelStateContextValue,
  clientContextValue,
) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig,
    state: { membership: {} },
    ...channelProps,
  });

  const wrapper = ({ children }) => (
    <ChatProvider value={{ client, ...clientContextValue }}>
      <ChannelStateProvider value={{ channel, ...channelStateContextValue }}>
        {children}
      </ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useUserRole(message, false), { wrapper });
  return result.current;
}

describe('useUserRole custom hook', () => {
  afterEach(jest.clearAllMocks);
  it.each([
    ['belongs', alice, true],
    ['does not belong', bob, false],
  ])('should tell when the message %s to user', async (_, user, expected) => {
    const message = generateMessage({ user });
    const { isMyMessage } = await renderUserRoleHook(message);
    expect(isMyMessage).toBe(expected);
  });

  it.each([
    ['admin', true],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', false],
  ])('should tell if user is admin when user has %s role', async (role, expected) => {
    const message = generateMessage();
    const adminUser = generateUser({ role });
    const clientMock = await getTestClientWithUser(adminUser);
    const { isAdmin } = await renderUserRoleHook(message, {}, {}, { client: clientMock });
    expect(isAdmin).toBe(expected);
  });

  it.each([
    ['admin', true],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', false],
  ])(
    'should tell if user is admin when channel state membership is set to %s',
    async (role, expected) => {
      const message = generateMessage();
      const { isAdmin } = await renderUserRoleHook(message, {
        state: {
          membership: {
            role,
          },
        },
      });
      expect(isAdmin).toBe(expected);
    },
  );

  it.each([
    ['admin', false],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', true],
  ])(
    'should tell if user is owner when channel state membership is set to %s',
    async (role, expected) => {
      const message = generateMessage();
      const { isOwner } = await renderUserRoleHook(message, {
        state: {
          membership: {
            role,
          },
        },
      });
      expect(isOwner).toBe(expected);
    },
  );

  it.each([
    ['admin', false],
    ['member', false],
    ['moderator', true],
    ['channel_moderator', true],
    ['owner', false],
  ])(
    'should tell if user is moderator when channel state membership is set to %s',
    async (role, expected) => {
      const message = generateMessage();
      const { isModerator } = await renderUserRoleHook(message, {
        state: {
          membership: {
            role,
          },
        },
      });
      expect(isModerator).toBe(expected);
    },
  );

  it.each([
    ['member', false],
    ['admin', true],
    ['moderator', true],
    ['channel_moderator', true],
    ['owner', false],
  ])('should allow user to edit or delete message if user role is %s', async (role, expected) => {
    const message = generateMessage();
    const { canDelete, canEdit } = await renderUserRoleHook(
      message,
      {
        state: {
          membership: {
            role,
          },
        },
      },
      {
        channelCapabilities: {
          'delete-any-message': expected,
          'update-any-message': expected,
        },
      },
    );
    expect(canEdit).toBe(expected);
    expect(canDelete).toBe(expected);
  });
});
