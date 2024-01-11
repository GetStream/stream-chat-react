import React, { useEffect } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import {
  dispatchMessageNewEvent,
  dispatchMessageReadEvent,
  dispatchNotificationMarkUnread,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannel,
  useMockedApis,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import { MessageList } from '../MessageList';
import { Channel } from '../../Channel';
import { ChatProvider, useChatContext, useMessageContext } from '../../../context';
import { EmptyStateIndicator as EmptyStateIndicatorMock } from '../../EmptyStateIndicator';

jest.mock('../../EmptyStateIndicator', () => ({
  EmptyStateIndicator: jest.fn(),
}));

let chatClient;
let channel;
const user1 = generateUser();
const user2 = generateUser();
const message1 = generateMessage({ text: 'message1', user: user1 });
const reply1 = generateMessage({ parent_id: message1.id, text: 'reply1', user: user1 });
const reply2 = generateMessage({ parent_id: message1.id, text: 'reply2', user: user2 });
const mockedChannelData = generateChannel({
  members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
  messages: [message1],
});

const Avatar = () => <div data-testid='custom-avatar'>Avatar</div>;
const ChatContextOverrider = ({ children, contextOverrides }) => {
  const chatContext = useChatContext();
  return <ChatProvider value={{ ...chatContext, ...contextOverrides }}>{children}</ChatProvider>;
};

const renderComponent = ({ channelProps, chatClient, chatContext = {}, msgListProps }) =>
  render(
    <Chat client={chatClient}>
      <ChatContextOverrider contextOverrides={chatContext}>
        <Channel {...channelProps}>
          <MessageList {...msgListProps} />
        </Channel>
      </ChatContextOverrider>
    </Chat>,
  );

describe('MessageList', () => {
  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'vishal' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannelData)]);
    channel = chatClient.channel('messaging', mockedChannelData.id);
    await channel.watch();
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should add new message at bottom of the list', async () => {
    const { container, getByTestId, getByText } = renderComponent({
      channelProps: { channel },
      chatClient,
    });
    await waitFor(() => {
      expect(getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel));

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the thread head if provided', async () => {
    const MsgListHead = (props) => <div>{props.message.text}</div>;

    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: {
          head: <MsgListHead key={'head'} message={message1} />,
          messages: [reply1, reply2],
          threadList: true,
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(message1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply2.text)).toBeInTheDocument();
    });
  });

  it('should not render the thread head if not provided', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [reply1, reply2], thread: message1, threadList: true },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(message1.text)).not.toBeInTheDocument();
      expect(screen.queryByText(reply1.text)).toBeInTheDocument();
      expect(screen.queryByText(reply2.text)).toBeInTheDocument();
    });
  });

  it('should render EmptyStateIndicator with corresponding list type in main message list', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [] },
      });
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledWith(
        expect.objectContaining({ listType: 'message' }),
        expect.any(Object),
      );
    });
  });

  it('should not render EmptyStateIndicator with corresponding list type in thread', async () => {
    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages: [], threadList: true },
      });
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledTimes(0);
    });
  });

  it('Message UI components should render `Avatar` when the custom prop is provided', async () => {
    let renderResult;
    await act(() => {
      renderResult = renderComponent({
        channelProps: {
          Avatar,
          channel,
        },
        chatClient,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
    });
    const results = await axe(renderResult.container);
    expect(results).toHaveNoViolations();
  });

  it('should accept a custom group style function', async () => {
    const classNameSuffix = 'msg-list-test';
    let renderResult;
    await act(() => {
      renderResult = renderComponent({
        channelProps: {
          Avatar,
          channel,
        },
        chatClient,
        msgListProps: { groupStyles: () => classNameSuffix },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    for (let i = 0; i < 3; i++) {
      const newMessage = generateMessage({ text: `text-${i}`, user: user2 });
      act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel));
    }

    await waitFor(() => {
      expect(screen.getAllByTestId(`str-chat__li str-chat__li--${classNameSuffix}`)).toHaveLength(
        4,
      ); // 1 for channel initial message + 3 just sent
    });
    const results = await axe(renderResult.container);
    expect(results).toHaveNoViolations();
  });

  it('should render DateSeparator by default', async () => {
    let container;
    await act(() => {
      const result = renderComponent({
        channelProps: { channel },
        chatClient,
      });
      container = result.container;
    });

    await waitFor(() => {
      expect(document.querySelector('.str-chat__date-separator')).toBeTruthy();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render DateSeparator if disableDateSeparator is true', async () => {
    let container;
    await act(() => {
      const result = renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { disableDateSeparator: true },
      });
      container = result.container;
    });

    await waitFor(() => {
      expect(document.querySelector('.str-chat__date-separator')).toBeFalsy();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('unread messages', () => {
    const messages = Array.from({ length: 5 }, generateMessage);
    const unread_messages = 2;
    const lastReadMessage = messages[unread_messages];
    const separatorText = `${unread_messages} unread messages`;
    const dispatchMarkUnreadForChannel = ({ channel, client, payload = {} }) => {
      dispatchNotificationMarkUnread({
        channel,
        client,
        payload: {
          first_unread_message_id: messages[unread_messages + 1].id,
          last_read: lastReadMessage.created_at,
          last_read_message_id: lastReadMessage.id,
          unread_messages,
          user: client.user,
          ...payload,
        },
      });
    };

    let invokeIntersectionCb;

    beforeEach(() => {
      class IntersectionObserverMock {
        constructor(cb) {
          invokeIntersectionCb = cb;
        }
        disconnect() {
          return null;
        }
        observe() {
          return null;
        }
      }
      // eslint-disable-next-line jest/prefer-spy-on
      window.IntersectionObserver = IntersectionObserverMock;
    });
    afterEach(jest.clearAllMocks);
    afterAll(jest.restoreAllMocks);

    it('should display unread messages separator when channel is marked unread and remove it when marked read', async () => {
      jest.useFakeTimers();

      const { channel, client } = await initClientWithChannel();

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();

      await act(() => {
        dispatchMarkUnreadForChannel({ channel, client });
      });
      expect(screen.getByText(separatorText)).toBeInTheDocument();

      jest.runAllTimers();
      await act(() => {
        dispatchMessageReadEvent(client, client.user, channel);
      });

      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('should display custom unread messages separator when channel is marked unread', async () => {
      const customUnreadMessagesSeparatorText = 'CustomUnreadMessagesSeparator';
      const UnreadMessagesSeparator = () => <div>{customUnreadMessagesSeparatorText}</div>;
      const { channel, client } = await initClientWithChannel();

      await act(() => {
        renderComponent({
          channelProps: { channel, UnreadMessagesSeparator },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      expect(screen.queryByText(customUnreadMessagesSeparatorText)).not.toBeInTheDocument();

      await act(() => {
        dispatchMarkUnreadForChannel({ channel, client });
      });
      expect(screen.getByText(customUnreadMessagesSeparatorText)).toBeInTheDocument();
    });

    it('should not display unread messages separator in thread', async () => {
      const { channel, client } = await initClientWithChannel();

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: { messages, threadList: true },
        });
      });

      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();

      await act(() => {
        dispatchMarkUnreadForChannel({ channel, client });
      });
      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();
    });

    describe('notification', () => {
      const chatContext = { themeVersion: '2' };
      const notificationText = `${unread_messages} unread`;
      const observerEntriesScrolledBelowSeparator = [
        { boundingClientRect: { top: 10 }, isIntersecting: false, rootBounds: { bottom: 11 } },
      ];

      const setupTest = async ({
        channelProps = {},
        dispatchMarkUnreadPayload = {},
        entries,
        msgListProps = {},
      }) => {
        const { channel, client } = await initClientWithChannel();

        await act(() => {
          renderComponent({
            channelProps: { channel, ...channelProps },
            chatClient: client,
            chatContext,
            msgListProps: { messages, ...msgListProps },
          });
        });

        await act(() => {
          dispatchMarkUnreadForChannel({ channel, client, payload: dispatchMarkUnreadPayload });
        });

        await act(() => {
          invokeIntersectionCb(entries);
        });
      };

      it('should not display unread messages notification when scrolled to unread messages separator', async () => {
        await setupTest({ entries: [{ isIntersecting: true }] });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });

      it("should not display unread messages notification when unread messages separator top edge is above container's bottom", async () => {
        await setupTest({
          entries: [
            { boundingClientRect: { top: 11 }, isIntersecting: false, rootBounds: { bottom: 10 } },
          ],
        });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });

      it("should display unread messages notification when unread messages separator top edge is below container's bottom", async () => {
        await setupTest({ entries: observerEntriesScrolledBelowSeparator });
        expect(screen.getByText(notificationText)).toBeInTheDocument();
      });

      it('should display custom unread messages notification', async () => {
        const customUnreadMessagesNotificationText = 'customUnreadMessagesNotificationText';
        const UnreadMessagesNotification = () => <div>{customUnreadMessagesNotificationText}</div>;
        await setupTest({
          channelProps: { UnreadMessagesNotification },
          entries: observerEntriesScrolledBelowSeparator,
        });

        expect(screen.getByText(customUnreadMessagesNotificationText)).toBeInTheDocument();
      });

      it('should not display unread messages notification when first unread message id is unknown', async () => {
        await setupTest({
          dispatchMarkUnreadPayload: { first_unread_message_id: undefined },
          entries: observerEntriesScrolledBelowSeparator,
        });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });

      it('should not display unread messages notification when unread count is 0', async () => {
        await setupTest({
          dispatchMarkUnreadPayload: { unread_messages: 0 },
          entries: observerEntriesScrolledBelowSeparator,
        });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });

      it('should not display unread messages notification IntersectionObserver is undefined', async () => {
        window.IntersectionObserver = undefined;
        await setupTest({ entries: observerEntriesScrolledBelowSeparator });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });

      it('should not display unread messages notification in thread', async () => {
        await setupTest({
          entries: observerEntriesScrolledBelowSeparator,
          msgListProps: { threadList: true },
        });
        expect(screen.queryByText(notificationText)).not.toBeInTheDocument();
      });
    });
  });

  describe('props forwarded to Message', () => {
    it.each([
      ['getMarkMessageUnreadErrorNotification'],
      ['getMarkMessageUnreadSuccessNotification'],
    ])('calls %s', async (funcName) => {
      const markUnreadSpy = jest.spyOn(channel, 'markUnread');
      if (funcName === 'getMarkMessageUnreadErrorNotification')
        markUnreadSpy.mockRejectedValueOnce();

      const message = generateMessage();
      const notificationFunc = jest.fn();
      const Message = () => {
        const { handleMarkUnread } = useMessageContext();
        useEffect(() => {
          const event = { preventDefault: () => null };
          handleMarkUnread(event);
        }, []);
        return null;
      };

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient,
          msgListProps: { [funcName]: notificationFunc, Message, messages: [message] },
        });
      });

      expect(notificationFunc).toHaveBeenCalledWith(expect.objectContaining(message));
    });
  });
});
