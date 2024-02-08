import React, { useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import {
  dispatchMessageNewEvent,
  dispatchNotificationMarkUnread,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  initClientWithChannels,
  markReadApi,
  useMockedApis,
} from '../../../mock-builders';

import { Chat } from '../../Chat';
import { MessageList } from '../MessageList';
import { Channel } from '../../Channel';
import {
  ChatProvider,
  useChannelActionContext,
  useChatContext,
  useMessageContext,
} from '../../../context';
import { EmptyStateIndicator as EmptyStateIndicatorMock } from '../../EmptyStateIndicator';
import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { MessageListNotifications } from '../MessageListNotifications';
import { mockedApiResponse } from '../../../mock-builders/api/utils';

expect.extend(toHaveNoViolations);

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

  it('should render intro messages', async () => {
    const intro = generateMessage({ customType: 'message.intro' });
    const headerText = 'header is rendered';
    const Header = () => <div>{headerText}</div>;

    await act(() => {
      renderComponent({
        channelProps: { channel, HeaderComponent: Header },
        chatClient,
        msgListProps: {
          messages: [intro],
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(headerText)).toBeInTheDocument();
    });
  });

  it('should render system messages', async () => {
    const system = generateMessage({ text: 'system message is rendered', type: 'system' });

    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: {
          messages: [system],
        },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(system.text)).toBeInTheDocument();
    });
  });

  it('should use custom message list renderer if provided', async () => {
    const customRenderMessages = ({ messages }) =>
      messages.map((msg) => <li key={msg.id}>prefixed {msg.text}</li>);

    await act(() => {
      renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { renderMessages: customRenderMessages },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText(`prefixed ${message1.text}`)).toBeInTheDocument();
    });
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

    it('should keep displaying the unread messages separator when an unread channel is marked read on mount', async () => {
      const user = generateUser();
      const last_read_message_id = 'X';
      const lastReadMessage = generateMessage({ id: last_read_message_id });
      const messages = [lastReadMessage, generateMessage(), generateMessage()];
      const {
        channels: [channel],
        client: chatClient,
      } = await initClientWithChannels({
        channelsData: [
          {
            messages,
            read: [
              {
                last_read: lastReadMessage.created_at.toISOString(),
                last_read_message_id,
                unread_messages: 2,
                user,
              },
            ],
          },
        ],
        customUser: user,
      });

      const markReadMock = jest
        .spyOn(channel, 'markRead')
        .mockReturnValueOnce(markReadApi(channel));

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient,
          msgListProps: { messages },
        });
      });

      expect(markReadMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(separatorText)).toBeInTheDocument();
    });

    it('should display unread messages separator when a channel is marked unread and remove it when marked read by markRead()', async () => {
      jest.useFakeTimers();
      const markReadBtnTestId = 'test-mark-read';
      const MarkReadButton = () => {
        const { markRead } = useChannelActionContext();
        return (
          <button data-testid={markReadBtnTestId} onClick={markRead}>
            MarkRead
          </button>
        );
      };
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <MarkReadButton />
              <MessageList messages={messages} />
            </Channel>
          </Chat>,
        );
      });

      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();

      await act(() => {
        dispatchMarkUnreadForChannel({ channel, client });
      });
      expect(screen.getByText(separatorText)).toBeInTheDocument();

      jest.runAllTimers();
      useMockedApis(client, [mockedApiResponse(markReadApi(channel), 'post')]);
      await act(() => {
        fireEvent.click(screen.getByTestId(markReadBtnTestId));
      });

      expect(screen.queryByText(separatorText)).not.toBeInTheDocument();
      jest.useRealTimers();
    });

    it('should not display unread messages separator when the last read message is the newest channel message', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      await act(() => {
        const lastReadMessage = messages.slice(-1)[0];
        dispatchMarkUnreadForChannel({
          channel,
          client,
          payload: {
            last_read: lastReadMessage.created_at,
            last_read_message_id: lastReadMessage.id,
          },
        });
      });
      expect(screen.queryByTestId('unread-messages-separator')).not.toBeInTheDocument();
    });

    it('should display custom unread messages separator when channel is marked unread', async () => {
      const customUnreadMessagesSeparatorText = 'CustomUnreadMessagesSeparator';
      const UnreadMessagesSeparator = () => <div>{customUnreadMessagesSeparatorText}</div>;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

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

    it('should not display custom unread messages separator when last read message is the newest channel message', async () => {
      const customUnreadMessagesSeparatorText = 'CustomUnreadMessagesSeparator';
      const UnreadMessagesSeparator = () => <div>{customUnreadMessagesSeparatorText}</div>;
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await act(() => {
        renderComponent({
          channelProps: { channel, UnreadMessagesSeparator },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      expect(screen.queryByText(customUnreadMessagesSeparatorText)).not.toBeInTheDocument();

      await act(() => {
        const lastReadMessage = messages.slice(-1)[0];
        dispatchMarkUnreadForChannel({
          channel,
          client,
          payload: {
            last_read: lastReadMessage.created_at,
            last_read_message_id: lastReadMessage.id,
          },
        });
      });
      expect(screen.queryByText(customUnreadMessagesSeparatorText)).not.toBeInTheDocument();
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
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

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

    describe('ScrollToBottomButton', () => {
      const BUTTON_TEST_ID = 'message-notification';
      const NEW_MESSAGE_COUNTER_TEST_ID = 'unread-message-notification-counter';
      const MockMessageListNotifications = (props) => (
        <MessageListNotifications {...props} isMessageListScrolledToBottom={false} />
      );

      it('reflects the channel unread state', async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await act(() => {
          renderComponent({
            channelProps: {
              channel,
              MessageListNotifications: MockMessageListNotifications,
              MessageNotification: ScrollToBottomButton,
            },
            chatClient: client,
            msgListProps: { messages },
          });
        });

        expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();

        await act(() => {
          dispatchMarkUnreadForChannel({ channel, client });
        });

        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).toHaveTextContent(
          unread_messages,
        );
      });

      it('does not reflect the channel unread state in a thread', async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await act(() => {
          renderComponent({
            channelProps: {
              channel,
              MessageListNotifications: MockMessageListNotifications,
              MessageNotification: ScrollToBottomButton,
            },
            chatClient: client,
            msgListProps: { messages, threadList: true },
          });
        });

        expect(screen.queryByTestId(BUTTON_TEST_ID)).toBeInTheDocument();
        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();

        await act(() => {
          dispatchMarkUnreadForChannel({ channel, client });
        });
        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();
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
        }, [handleMarkUnread]);
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
