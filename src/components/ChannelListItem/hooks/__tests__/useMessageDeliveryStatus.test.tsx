import React from 'react';
import { renderHook } from '@testing-library/react';
import type { Channel, LocalMessage, MessageResponse, StreamChat } from 'stream-chat';
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
  mockChatContext,
  useMockedApis,
} from '../../../../mock-builders';
import { act } from '@testing-library/react';
import { dispatchMessageDeliveredEvent } from '../../../../mock-builders/event/messageDelivered';

const ownUser = generateUser({ id: 'own-user' });
const otherUser = generateUser();
const getClientAndChannel = async (channelData = {}, user = ownUser) => {
  const members = [
    generateMember({ user: ownUser }),
    generateMember({ user: otherUser }),
  ];
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
    generateMessage({ created_at: new Date(1000), user: otherUser }),
    generateMessage({ created_at: new Date(2000), user: ownUser }),
  ];
  const lastMessage = messages.slice(-1)[0];
  return { lastMessage, messages };
};

const othersLastMessage = () => {
  const messages = [
    generateMessage({ created_at: new Date(1000), user: ownUser }),
    generateMessage({ created_at: new Date(2000), user: otherUser }),
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
    user: ownUser,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: otherUser,
  },
];

const lastDeliveredOnlyToMe = (messages) => [
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: ownUser,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: otherUser,
  },
];

const lastReadOnlyByMe = (messages) => [
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[1].created_at.toISOString(),
    last_read_message_id: messages[1],
    unread_messages: 0,
    user: ownUser,
  },
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: otherUser,
  },
];

const lastMessageDelivered = (messages) => [
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: ownUser,
  },
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[0].created_at.toISOString(),
    unread_messages: 1,
    user: otherUser,
  },
];

const lastMessageRead = (messages) => [
  {
    last_delivered_at: messages[0].created_at.toISOString(),
    last_delivered_message_id: messages[0].id,
    last_read: messages[0].created_at.toISOString(),
    last_read_message_id: messages[0],
    unread_messages: 0,
    user: ownUser,
  },
  {
    last_delivered_at: messages[1].created_at.toISOString(),
    last_delivered_message_id: messages[1].id,
    last_read: messages[1].created_at.toISOString(),
    unread_messages: 0,
    user: otherUser,
  },
];

const renderComponent = ({
  channel,
  client,
  lastMessage,
}: {
  channel: Channel;
  client: StreamChat;
  lastMessage?: ReturnType<typeof generateMessage>;
}) => {
  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatContext.Provider value={mockChatContext({ client })}>
      {children}
    </ChatContext.Provider>
  );

  return renderHook(
    () => useMessageDeliveryStatus({ channel, lastMessage: lastMessage as LocalMessage }),
    {
      wrapper,
    },
  );
};

describe('Message delivery status', () => {
  describe('when initiated from channel state', () => {
    it('is undefined if there are no messages in the channel', async () => {
      const { channel, client } = await getClientAndChannel({ messages: [] });
      const { result } = renderComponent({ channel, client });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "sent" if the last message does not have creation date', async () => {
      // MERGE-RECONCILE: PR #2909 rewrote the hook to derive status purely from
      // channel.messageReceiptsTracker (keyed by message timestamp) and dropped the previous
      // `!lastMessage.created_at` guard. An own message without a creation date cannot be located
      // in the tracker, so it has no readers/delivered receipts and resolves to "sent" rather than
      // the previous `undefined`.
      const messages = [generateMessage({ created_at: undefined, user: ownUser })];
      const lastMessage = messages[0];
      const read = [
        {
          last_read: lastMessage.created_at,
          last_read_message_id: lastMessage.id,
          unread_messages: 0,
          user: ownUser,
        },
        {
          last_read: '1970-01-01T00:00:00.00Z',
          unread_messages: 1,
          user: otherUser,
        },
      ];
      const { channel, client } = await getClientAndChannel({ messages, read });
      const { result } = renderComponent({ channel, client, lastMessage });
      expect(result.current.messageDeliveryStatus).toBe(MessageDeliveryStatus.SENT);
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
        user: otherUser,
      });
      await act(() => {
        dispatchMessageNewEvent(client, newMessage, channel);
      });
      expect(result.current.messageDeliveryStatus).toBeUndefined();
    });

    it('is "sent" when a new own message becomes the last message', async () => {
      // MERGE-RECONCILE: PR #2909 removed the internal `message.new` handler; status is now a pure
      // function of the `lastMessage` prop + tracker snapshot. The parent supplies the freshly
      // received own message as `lastMessage`; with a creation date later than every read/delivered
      // cursor it has no receipts yet and resolves to "sent".
      const { messages } = ownLastMessage();
      const read = lastMessageRead(messages);
      const { channel, client } = await getClientAndChannel({ messages, read });

      const newMessage = generateMessage({
        created_at: new Date(3000),
        user: ownUser,
      });
      const { rerender, result } = renderComponent({
        channel,
        client,
        lastMessage: newMessage,
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
          user: otherUser,
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
          user: ownUser,
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
          user: otherUser,
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
          user: otherUser,
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
        // MERGE-RECONCILE: delivery status is now derived from channel.messageReceiptsTracker,
        // which records readers per message id — the read event must reference lastMessage.id
        // for the channel to count as "read up to the last (own) message" by otherUser.
        dispatchMessageReadEvent(client, otherUser, channel, lastMessage.id);
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
        dispatchMessageReadEvent(client, otherUser, channel);
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
        dispatchMessageReadEvent(client, ownUser, channel);
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
        dispatchMessageUpdatedEvent(client, updatedMessage as MessageResponse, channel);
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
        dispatchMessageUpdatedEvent(client, updatedMessage as MessageResponse, channel);
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
