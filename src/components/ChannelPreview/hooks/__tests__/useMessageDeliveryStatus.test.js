import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  MessageDeliveryStatus,
  useMessageDeliveryStatus,
} from '../useMessageDeliveryStatus';
import { ChatContext } from '../../../../context';
import {
  dispatchMessageDeletedEvent,
  dispatchMessageNewEvent,
  dispatchMessageReadEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { act } from '@testing-library/react';

const userA = generateUser();
const userB = generateUser();
const getClientAndChannel = async (channelData = {}, user = userA) => {
  const members = [generateMember({ user: userA }), generateMember({ user: userB })];
  const client = await getTestClientWithUser(user);
  const mockedChannel = generateChannel({
    members,
    ...channelData,
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);

  const channel = client.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  return {
    channel,
    client,
  };
};

const renderComponent = ({ channel, client, lastMessage }) => {
  const wrapper = ({ children }) => (
    <ChatContext.Provider value={{ client }}>{children}</ChatContext.Provider>
  );

  return renderHook(() => useMessageDeliveryStatus({ channel, lastMessage }), {
    wrapper,
  });
};

describe('Message delivery status', () => {
  describe('when initiated from channel state', () => {
    it('is undefined if there are no messages in the channel', async () => {
      const { channel, client } = await getClientAndChannel({ messages: [] });
      const { result } = renderComponent({ channel, client });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is undefined if the last message does not have creation date', async () => {
      const messages = [generateMessage({ created_at: undefined, user: userA })];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: lastMessage.created_at,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: '1970-01-01T00:00:00.00Z',
          unread_messages: 1,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is undefined if the last message was created by another user', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userB }),
      ];
      const lastMessage = messages[1];
      const read = [
        {
          last_read: messages[1].created_at.toISOString(),
          last_read_message_id: messages[1].id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0].id,
          unread_messages: 1,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "delivered" if the last message in channel was not read by any member other than me', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userA }),
      ];
      const lastMessage = messages[1];
      const read = [
        {
          last_read: messages[1].created_at.toISOString(),
          last_read_message_id: messages[1].id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0].id,
          unread_messages: 1,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('is "read" if the last message in channel was read by at least 1 other member', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userA }),
      ];
      const lastMessage = messages[1];
      const last_read = '1970-01-01T00:00:03.00Z';
      const read = [
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });
  });

  describe('on message.new event when other user is muted', () => {
    // message.read is not delivered over the WS, when the other is muted
    it('is undefined if receives new message to empty channel', async () => {
      const { channel, client } = await getClientAndChannel({ messages: [] });
      client.mutedUsers = [{ target: userB }];
      const { result } = renderComponent({ channel, client });
      const newMessage = generateMessage({
        created_at: new Date('1970-01-01T00:00:02.00Z'),
        user: userB,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "delivered" if received new message to a channel with last message from own user', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0],
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: '1970-01-01T00:00:01.00Z',
          unread_messages: 1,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      client.mutedUsers = [{ target: userB }];
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);

      const newMessage = generateMessage({
        created_at: new Date('1970-01-01T00:00:02.00Z'),
        user: userA,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('is "delivered" if received new message to channel with last message from another user', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userB }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0],
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0],
          unread_messages: 0,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      client.mutedUsers = [{ target: userB }];
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBeUndefined();

      const newMessage = generateMessage({
        created_at: new Date('1970-01-01T00:00:02.00Z'),
        user: userA,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });
  });

  describe('on event', () => {
    it('is undefined if the new message was created by another user', async () => {
      const last_read = '1970-01-01T00:00:02.00Z';
      const read = [
        {
          last_read,
          user: userA,
        },
        {
          last_read,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages: [], read });
      const { rerender, result } = renderComponent({ channel, client });

      const newMessage = generateMessage({
        created_at: new Date('1970-01-01T00:00:02.00Z'),
        user: userB,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "delivered" if the channel was not marked read by another user', async () => {
      const last_read = '1970-01-01T00:00:02.00Z';
      const read = [
        {
          last_read,
          user: userA,
        },
        {
          last_read,
          user: userB,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages: [], read });
      const { rerender, result } = renderComponent({ channel, client });

      const newMessage = generateMessage({
        created_at: new Date('1970-01-01T00:00:02.00Z'),
        user: userA,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('is "read" if the channel was read by another user', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0].id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: '1970-01-01T00:00:01.00Z',
          unread_messages: 1,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageReadEvent(client, userB, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });

    it('should ignore mark.read if the last message is not own', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userB }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: messages[0].created_at.toISOString(),
          last_read_message_id: messages[0].id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: messages[0].created_at.toISOString(),
          unread_messages: 1,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageReadEvent(client, userB, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is kept "delivered" when the last unread message is updated', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: lastMessage.created_at.toISOString(),
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: '1970-01-01T00:00:02.00Z',
          unread_messages: 1,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);

      const updatedMessage = {
        ...lastMessage,
        updated_at: new Date('1970-01-01T00:00:02.00Z'),
      };

      await act(() => {
        dispatchMessageUpdatedEvent(client, updatedMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('does not regress to "delivered" when the last read message is updated', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const last_read = '1970-01-01T00:00:03.00Z';
      const read = [
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);

      const updatedMessage = {
        ...lastMessage,
        updated_at: new Date('1970-01-01T00:00:02.00Z'),
      };

      await act(() => {
        dispatchMessageUpdatedEvent(client, updatedMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });

    it('is kept "delivered" when the last unread message is deleted', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:02.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: lastMessage.created_at.toISOString(),
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read: '1970-01-01T00:00:02.00Z',
          unread_messages: 1,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);

      await act(() => {
        dispatchMessageDeletedEvent(client, lastMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('does not regress to "delivered" when the last message is deleted', async () => {
      const messages = [
        generateMessage({ created_at: new Date('1970-01-01T00:00:01.00Z'), user: userA }),
      ];
      const lastMessage = messages[0];
      const last_read = '1970-01-01T00:00:03.00Z';
      const read = [
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userA,
        },
        {
          last_read,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: userB,
        },
      ];

      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);

      await act(() => {
        dispatchMessageDeletedEvent(client, lastMessage, channel);
      });

      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });
  });
});
