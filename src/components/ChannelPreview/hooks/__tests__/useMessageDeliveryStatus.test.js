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
import { dispatchMessageDeliveredEvent } from '../../../../mock-builders/event/messageDelivered';

const userA = generateUser({ id: 'own-user' });
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

const ownLastMessage = () => {
  const messages = [
    generateMessage({ created_at: new Date(1000), user: userB }),
    generateMessage({ created_at: new Date(2000), user: userA }),
  ];
  const lastMessage = messages.slice(-1)[0];
  return { lastMessage, messages };
};

const othersLastMessage = () => {
  const messages = [
    generateMessage({ created_at: new Date(1000), user: userA }),
    generateMessage({ created_at: new Date(2000), user: userB }),
  ];
  const lastMessage = messages.slice(-1)[0];
  return { lastMessage, messages };
};

const lastMessageCreated = (messages) => [
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: userA,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: userB,
  },
];

const lastDeliveredOnlyToMe = (messages) => [
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: userA,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: userB,
  },
];

const lastReadOnlyByMe = (messages) => [
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[1].created_at.toISOString(),
    last_read_message_id: messages[1],
    unread_messages: 0,
    user: userA,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: userB,
  },
];

const lastMessageDelivered = (messages) => [
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: userA,
  },
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: userB,
  },
];

const lastMessageRead = (messages) => [
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: userA,
  },
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[1].created_at.toISOString(),
    unread_messages: 0,
    user: userB,
  },
];

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
      const { lastMessage, messages } = othersLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "sent" if the last message was not delivered neither read by any other member', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageCreated(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });

    it('is "sent" if the last message was delivered only to own user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastDeliveredOnlyToMe(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });

    it('is "sent" if the last message was read only by own user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastReadOnlyByMe(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });

    it('is "delivered" if the last message in channel was delivered but not read by any member other than me', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageDelivered(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });

    it('is "read" if the last message in channel was read by at least 1 other member', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });
  });

  describe('on message.new event', () => {
    it('is undefined if receives new message from another user', async () => {
      const { channel, client } = await getClientAndChannel({ messages: [] });

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

    it('is "created" if received new message to a channel with last message from own user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      const newMessage = generateMessage({
        created_at: new Date(2000),
        user: userA,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });
  });

  describe('on message.delivered event', () => {
    it('is "delivered" if the last message is own and delivery receipt from another user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageCreated(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageDeliveredEvent({
          channel,
          client,
          deliveredAt: new Date(
            new Date(lastMessage.created_at).getTime() + 1000,
          ).toISOString(),
          lastDeliveredMessageId: lastMessage.id,
          user: userB,
        });
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });
    it('is ignored if the last message is own and delivery receipt from own user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageCreated(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageDeliveredEvent({
          channel,
          client,
          deliveredAt: new Date(
            new Date(lastMessage.created_at).getTime() + 1000,
          ).toISOString(),
          lastDeliveredMessageId: lastMessage.id,
          user: userA,
        });
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });
    it('is ignored if the last message is not own and delivery receipt from another user', async () => {
      const { lastMessage, messages } = othersLastMessage();
      const read = lastMessageCreated(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageDeliveredEvent({
          channel,
          client,
          deliveredAt: new Date(
            new Date(lastMessage.created_at).getTime() + 1000,
          ).toISOString(),
          lastDeliveredMessageId: lastMessage.id,
          user: userB,
        });
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });
    it('is ignored if the last delivered message id does not match the last message in channel', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageCreated(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageDeliveredEvent({
          channel,
          client,
          deliveredAt: new Date(
            new Date(lastMessage.created_at).getTime() + 1000,
          ).toISOString(),
          lastDeliveredMessageId: 'another-message-id',
          user: userB,
        });
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
    });
  });

  describe('on message.read event', () => {
    it('is "read" if the channel was read by another user', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageDelivered(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageReadEvent(client, userB, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });

    it('should be status "undefined" if the last message is not own', async () => {
      const { lastMessage, messages } = othersLastMessage();
      const read = lastMessageDelivered(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageReadEvent(client, userB, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('should ignore mark.read if the event is own', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageDelivered(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageReadEvent(client, userA, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });
  });

  describe('on other events', () => {
    it('is kept "delivered" when the last unread message is updated', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageDelivered(messages);

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
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      const updatedMessage = {
        ...lastMessage,
        updated_at: new Date(4000),
      };

      await act(() => {
        dispatchMessageUpdatedEvent(client, updatedMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });

    it('does not regress to "delivered" when the last message is deleted', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);

      await act(() => {
        dispatchMessageDeletedEvent(client, lastMessage, channel);
      });

      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.READ);
    });

    it('is kept "delivered" when the last unread message is deleted', async () => {
      const { lastMessage, messages } = ownLastMessage();
      const read = lastMessageDelivered(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { rerender, result } = renderComponent({ channel, client, lastMessage });

      await act(() => {
        dispatchMessageDeletedEvent(client, lastMessage, channel);
      });
      rerender();
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.DELIVERED);
    });
  });
});
