import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  getTestClientWithUser,
  generateChannel,
  generateMessage,
  generateUser,
} from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useUserRole } from '../useUserRole';

const getConfig = jest.fn();
const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

async function renderUserRoleHook(
  message = generateMessage(),
  channelProps,
  channelContextValue,
) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    getConfig,
    ...channelProps,
  });
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        ...channelContextValue,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useUserRole(message), { wrapper });
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
  ])(
    'should tell if user is admin when user has %s role',
    async (role, expected) => {
      const message = generateMessage();
      const adminUser = generateUser({ role });
      const clientMock = await getTestClientWithUser(adminUser);
      const { isAdmin } = await renderUserRoleHook(
        message,
        {},
        { client: clientMock },
      );
      expect(isAdmin).toBe(expected);
    },
  );

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
    ['owner', true],
  ])(
    'should allow user to edit or delete message if user role is %s',
    async (role, expected) => {
      const message = generateMessage();
      const { canDeleteMessage, canEditMessage } = await renderUserRoleHook(
        message,
        {
          state: {
            membership: {
              role,
            },
          },
        },
      );
      expect(canEditMessage).toBe(expected);
      expect(canDeleteMessage).toBe(expected);
    },
  );
});
