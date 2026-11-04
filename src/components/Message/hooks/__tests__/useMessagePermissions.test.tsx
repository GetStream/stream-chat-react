import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelState, LocalMessage, StreamChat } from 'stream-chat';

import { useMessagePermissions } from '../useMessagePermissions';

import { ChannelInstanceProvider, ChatProvider } from '../../../../context';
import {
  generateChannelState,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });

// Converts a `{ capability: boolean }` map into the `ownCapabilities` string[] of enabled ones.
const toOwnCapabilities = (capabilities: Record<string, boolean> = {}) =>
  Object.entries(capabilities)
    .filter(([, enabled]) => enabled)
    .map(([capability]) => capability);

async function renderMessagePermissionsHook({
  channelProps = {},
  channelStateContextValue = {},
  clientContextValue = {},
  message = generateMessage(),
}: {
  channelProps?: { state?: { membership?: Partial<ChannelState['membership']> } };
  channelStateContextValue?: { channelCapabilities?: Record<string, boolean> };
  clientContextValue?: { client?: StreamChat };
  message?: LocalMessage;
} = {}) {
  const client = clientContextValue.client ?? (await getTestClientWithUser(alice));
  const channel = fromPartial<Channel>({
    cid: 'messaging:permissions-test',
    state: generateChannelState({
      membership: fromPartial<ChannelState['membership']>(
        channelProps.state?.membership ?? {},
      ),
      ownCapabilities: toOwnCapabilities(channelStateContextValue.channelCapabilities),
    }),
  });

  const wrapper = ({ children }: React.PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>{children}</ChannelInstanceProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useMessagePermissions(message), { wrapper });
  return result.current;
}

describe('useMessagePermissions', () => {
  afterEach(vi.clearAllMocks);

  it.each([
    ['belongs', alice, true],
    ['does not belong', bob, false],
  ])('should tell when the message %s to user', async (_, user, expected) => {
    const message = generateMessage({ user });
    const { isMyMessage } = await renderMessagePermissionsHook({ message });
    expect(isMyMessage).toBe(expected);
  });

  it('does not return membership-role flags', async () => {
    const result = await renderMessagePermissionsHook({
      channelProps: { state: { membership: { is_moderator: true, role: 'owner' } } },
    });
    expect(result).not.toHaveProperty('isAdmin');
    expect(result).not.toHaveProperty('isModerator');
    expect(result).not.toHaveProperty('isOwner');
  });

  it.each([
    ['member', false],
    ['member', true],
    ['admin', true],
    ['admin', false],
    ['moderator', true],
    ['channel_moderator', true],
    ['owner', false],
  ])(
    'takes canEdit and canDelete from the any-message capabilities, not the %s role',
    async (role, expected) => {
      const { canDelete, canEdit } = await renderMessagePermissionsHook({
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
    },
  );

  it('checks only the permission for canEdit, so a poll message stays editable', async () => {
    const message = {
      ...generateMessage({ poll_id: 'poll-1', user: alice }),
      poll: fromPartial({ id: 'poll-1' }),
    } as LocalMessage;
    const { canEdit } = await renderMessagePermissionsHook({
      channelStateContextValue: { channelCapabilities: { 'update-own-message': true } },
      message,
    });
    expect(canEdit).toBe(true);
  });

  describe('canDo flags', () => {
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
      'determine message edit permission',
      async (updateAnyPermission, updateOwnPermission, messageAuthor, expected) => {
        const message = generateMessage({ user: messageAuthor });
        const { canEdit } = await renderMessagePermissionsHook({
          channelStateContextValue: {
            channelCapabilities: {
              'update-any-message': updateAnyPermission,
              'update-own-message': updateOwnPermission,
            },
          },
          message,
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
        const { canDelete } = await renderMessagePermissionsHook({
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
    ])(
      'determine flag message permission',
      async (flagMessagePerm, messageAuthor, expected) => {
        const message = generateMessage({ user: messageAuthor });
        const { canFlag } = await renderMessagePermissionsHook({
          channelStateContextValue: {
            channelCapabilities: {
              'flag-message': flagMessagePerm,
            },
          },
          message,
        });
        expect(canFlag).toBe(expected);
      },
    );

    it.each([
      [true, alice, false],
      [true, bob, true],
      [false, alice, false],
      [false, bob, false],
    ])(
      'determine mute channel permission',
      async (muteChannelPerm, messageAuthor, expected) => {
        const message = generateMessage({ user: messageAuthor });
        const { canMute } = await renderMessagePermissionsHook({
          channelStateContextValue: {
            channelCapabilities: {
              'mute-channel': muteChannelPerm,
            },
          },
          message,
        });
        expect(canMute).toBe(expected);
      },
    );

    it.each([
      [true, alice, false],
      [true, bob, true],
      [false, alice, false],
      [false, bob, false],
    ])(
      'determine mark unread permission',
      async (readEventsPerm, messageAuthor, expected) => {
        const message = generateMessage({ user: messageAuthor });
        const { canMarkUnread } = await renderMessagePermissionsHook({
          channelStateContextValue: {
            channelCapabilities: {
              'read-events': readEventsPerm,
            },
          },
          message,
        });
        expect(canMarkUnread).toBe(expected);
      },
    );

    it.each([
      [true, true],
      [false, false],
    ])('determine quote message permission', async (quoteMessagePerm, expected) => {
      const { canQuote } = await renderMessagePermissionsHook({
        channelStateContextValue: {
          channelCapabilities: {
            'quote-message': quoteMessagePerm,
          },
        },
      });
      expect(canQuote).toBe(expected);
    });

    it.each([
      [true, true],
      [false, false],
    ])('determine react to a message permission', async (sendReactionPerm, expected) => {
      const { canReact } = await renderMessagePermissionsHook({
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
    ])('determine reply to a message permission', async (sendReplyPerm, expected) => {
      const { canReply } = await renderMessagePermissionsHook({
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
