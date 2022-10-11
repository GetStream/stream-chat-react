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

async function renderUserRoleHook({
  channelProps = {},
  channelStateContextValue = {},
  clientContextValue = {},
  disableQuotedMessages,
  message = generateMessage(),
  onlySenderCanEdit = false,
}) {
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

  const { result } = renderHook(
    () => useUserRole(message, onlySenderCanEdit, disableQuotedMessages),
    { wrapper },
  );
  return result.current;
}

describe('useUserRole custom hook', () => {
  afterEach(jest.clearAllMocks);

  it.each([
    ['belongs', alice, true],
    ['does not belong', bob, false],
  ])('should tell when the message %s to user', async (_, user, expected) => {
    const message = generateMessage({ user });
    const { isMyMessage } = await renderUserRoleHook({ message });
    expect(isMyMessage).toBe(expected);
  });

  it.each([
    ['admin', true],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', false],
  ])('should tell if user is admin when user has %s role', async (role, expected) => {
    const adminUser = generateUser({ role });
    const clientMock = await getTestClientWithUser(adminUser);
    const { isAdmin } = await renderUserRoleHook({ clientContextValue: { client: clientMock } });
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
      const { isAdmin } = await renderUserRoleHook({
        channelProps: {
          state: {
            membership: {
              role,
            },
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
      const { isOwner } = await renderUserRoleHook({
        channelProps: {
          state: {
            membership: {
              role,
            },
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
    'should tell if user is moderator when channel state membership role is set to %s',
    async (role, expected) => {
      const { isModerator } = await renderUserRoleHook({
        channelProps: {
          state: {
            membership: {
              role,
            },
          },
        },
      });
      expect(isModerator).toBe(expected);
    },
  );

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])(
    'should tell if user is moderator when channel state membership is_moderator is set to %s',
    async (bool, expected) => {
      const { isModerator } = await renderUserRoleHook({
        channelProps: {
          state: {
            membership: {
              is_moderator: bool,
            },
          },
        },
      });
      expect(isModerator).toBe(expected);
    },
  );

  it.each([
    ['admin', false],
    ['member', false],
    ['channel_moderator', true],
    ['owner', false],
  ])(
    'should tell if user is moderator when channel state membership channel_role is set to %s',
    async (role, expected) => {
      const { isModerator } = await renderUserRoleHook({
        channelProps: {
          state: {
            membership: {
              channel_role: role,
            },
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
    const { canDelete, canEdit } = await renderUserRoleHook({
      channelProps: {
        state: {
          membership: {
            role,
          },
        },
      },
      channelStateContextValue: {
        channelCapabilities: {
          'delete-any-message': expected,
          'update-any-message': expected,
        },
      },
    });
    expect(canEdit).toBe(expected);
    expect(canDelete).toBe(expected);
  });

  describe('canDo flags', () => {
    it.each([
      [true, true, true, alice, true],
      [true, true, true, bob, false],
      [false, true, true, alice, true],
      [false, true, true, bob, true],
      [true, false, true, alice, true],
      [true, false, true, bob, false],
      [true, true, false, alice, false],
      [true, true, false, bob, false],
      [false, false, true, alice, true],
      [false, false, true, bob, false],
      [false, true, false, alice, true],
      [false, true, false, bob, true],
      [true, false, false, alice, false],
      [true, false, false, bob, false],
      [false, false, false, alice, false],
      [false, false, false, bob, false],
    ])(
      'determine message edit permission',
      async (
        onlySenderCanEdit,
        updateAnyPermission,
        updateOwnPermission,
        messageAuthor,
        expected,
      ) => {
        const message = generateMessage({ user: messageAuthor });
        const { canEdit } = await renderUserRoleHook({
          channelStateContextValue: {
            channelCapabilities: {
              'update-any-message': updateAnyPermission,
              'update-own-message': updateOwnPermission,
            },
          },
          message,
          onlySenderCanEdit,
        });
        expect(canEdit).toBe(expected);
      },
    );

    it.each([
      [true, true, alice, true],
      [true, true, bob, true],
      [false, true, alice, true],
      [false, true, bob, false],
      [true, false, alice, true],
      [true, false, bob, true],
      [false, false, alice, false],
      [false, false, bob, false],
    ])(
      'determine delete message permission',
      async (deleteAnyMessagePerm, deleteOwnMessagePerm, messageAuthor, expected) => {
        const message = generateMessage({ user: messageAuthor });
        const { canDelete } = await renderUserRoleHook({
          channelStateContextValue: {
            channelCapabilities: {
              'delete-any-message': deleteAnyMessagePerm,
              'delete-own-message': deleteOwnMessagePerm,
            },
          },
          message,
        });
        expect(canDelete).toBe(expected);
      },
    );

    it.each([
      [true, alice, false],
      [true, bob, true],
      [false, alice, false],
      [false, bob, false],
    ])('determine flag message permission', async (flagMessagePerm, messageAuthor, expected) => {
      const message = generateMessage({ user: messageAuthor });
      const { canFlag } = await renderUserRoleHook({
        channelStateContextValue: {
          channelCapabilities: {
            'flag-message': flagMessagePerm,
          },
        },
        message,
      });
      expect(canFlag).toBe(expected);
    });

    it.each([
      [true, alice, false],
      [true, bob, true],
      [false, alice, false],
      [false, bob, false],
    ])('determine mute channel permission', async (muteChannelPerm, messageAuthor, expected) => {
      const message = generateMessage({ user: messageAuthor });
      const { canMute } = await renderUserRoleHook({
        channelStateContextValue: {
          channelCapabilities: {
            'mute-channel': muteChannelPerm,
          },
        },
        message,
      });
      expect(canMute).toBe(expected);
    });

    it.each([
      [true, true, false],
      [true, false, false],
      [false, true, true],
      [false, false, false],
    ])(
      'determine quote message permission',
      async (disableQuotedMessages, quoteMessagePerm, expected) => {
        const { canQuote } = await renderUserRoleHook({
          channelStateContextValue: {
            channelCapabilities: {
              'quote-message': quoteMessagePerm,
            },
          },
          disableQuotedMessages,
        });
        expect(canQuote).toBe(expected);
      },
    );

    it.each([
      [true, true],
      [false, false],
    ])('determine react to a message permission', async (sendReactionPerm, expected) => {
      const { canReact } = await renderUserRoleHook({
        channelStateContextValue: {
          channelCapabilities: {
            'send-reaction': sendReactionPerm,
          },
        },
      });
      expect(canReact).toBe(expected);
    });

    it.each([
      [true, true],
      [false, false],
    ])('determine react to a message permission', async (sendReplyPerm, expected) => {
      const { canReply } = await renderUserRoleHook({
        channelStateContextValue: {
          channelCapabilities: {
            'send-reply': sendReplyPerm,
          },
        },
      });
      expect(canReply).toBe(expected);
    });
  });
});
