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
  useChannelActionContext,
  useMessageContext,
  WithComponents,
} from '../../../context';
import { EmptyStateIndicator as EmptyStateIndicatorMock } from '../../EmptyStateIndicator';
import { mockedApiResponse } from '../../../mock-builders/api/utils';
import { nanoid } from 'nanoid';

expect.extend(toHaveNoViolations);

jest.mock('../../EmptyStateIndicator', () => ({
  EmptyStateIndicator: jest.fn(),
}));

const UNREAD_MESSAGES_SEPARATOR_TEST_ID = 'unread-messages-separator';

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

const renderComponent = ({ channelProps, chatClient, components = {}, msgListProps }) =>
  render(
    <Chat client={chatClient}>
      <Channel {...channelProps}>
        <WithComponents overrides={components}>
          <MessageList {...msgListProps} />
        </WithComponents>
      </Channel>
    </Chat>,
  );

describe('MessageList', () => {
  let chatClient;
  let channel;
  let markReadMock;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'vishal' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannelData)]);
    channel = chatClient.channel('messaging', mockedChannelData.id);
    await channel.watch();

    markReadMock = jest
      .spyOn(channel, 'markRead')
      .mockResolvedValue(markReadApi(channel));
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    markReadMock.mockRestore();
  });

  it('should add new message at the bottom of the list', async () => {
    const { findByTestId, getByText } = renderComponent({
      channelProps: { channel },
      chatClient,
    });

    expect(await findByTestId('reverse-infinite-scroll')).toBeInTheDocument();

    const newMessage = generateMessage({ user: user2 });
    act(() => dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel));

    await waitFor(() => {
      expect(getByText(newMessage.text)).toBeInTheDocument();
    });
    // MessageErrorIcon has path with id "background" - that is not permitted from the a11i standpoint
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
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
    renderComponent({
      channelProps: { channel },
      chatClient,
      msgListProps: { messages: [] },
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledWith(
        expect.objectContaining({ listType: 'message' }),
        undefined,
      );
    });
  });

  it('should not render EmptyStateIndicator with corresponding list type in thread', async () => {
    renderComponent({
      channelProps: { channel },
      chatClient,
      msgListProps: { messages: [], threadList: true },
    });

    await waitFor(() => {
      expect(EmptyStateIndicatorMock).toHaveBeenCalledTimes(0);
    });
  });

  it('Message UI components should render `Avatar` when the custom prop is provided', async () => {
    const renderResult = renderComponent({
      channelProps: {
        channel,
      },
      chatClient,
      components: {
        Avatar,
      },
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

    renderComponent({
      channelProps: {
        Avatar,
        channel,
      },
      chatClient,
      msgListProps: { groupStyles: () => classNameSuffix },
    });

    await waitFor(() => {
      expect(screen.getByTestId('reverse-infinite-scroll')).toBeInTheDocument();
    });

    for (let i = 0; i < 3; i++) {
      const newMessage = generateMessage({ text: `text-${i}`, user: user2 });
      act(() =>
        dispatchMessageNewEvent(chatClient, newMessage, mockedChannelData.channel),
      );
    }

    await waitFor(() => {
      expect(
        screen.getAllByTestId(`str-chat__li str-chat__li--${classNameSuffix}`),
      ).toHaveLength(4); // 1 for channel initial message + 3 just sent
    });
    // MessageErrorIcon has path with id "background" - that is not permitted from the a11i standpoint
    // const results = await axe(renderResult.container);
    // expect(results).toHaveNoViolations();
  });

  it('should render DateSeparator by default', async () => {
    const { container } = renderComponent({
      channelProps: { channel },
      chatClient,
    });

    await waitFor(() => {
      expect(document.querySelector('.str-chat__date-separator')).toBeTruthy();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render DateSeparator if disableDateSeparator is true', async () => {
    const { container } = renderComponent({
      channelProps: { channel },
      chatClient,
      msgListProps: { disableDateSeparator: true },
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

    renderComponent({
      channelProps: { channel },
      chatClient,
      components: { HeaderComponent: Header },
      msgListProps: {
        messages: [intro],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(headerText)).toBeInTheDocument();
    });
  });

  it('should render system messages', async () => {
    const system = generateMessage({
      text: 'system message is rendered',
      type: 'system',
    });

    renderComponent({
      channelProps: { channel },
      chatClient,
      msgListProps: {
        messages: [system],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(system.text)).toBeInTheDocument();
    });
  });

  it('should use custom message list renderer if provided', async () => {
    const customRenderMessages = ({ messages }) =>
      messages.map((msg) => <li key={msg.id}>prefixed {msg.text}</li>);

    renderComponent({
      channelProps: { channel },
      chatClient,
      msgListProps: { renderMessages: customRenderMessages },
    });

    await waitFor(() => {
      expect(screen.queryByText(`prefixed ${message1.text}`)).toBeInTheDocument();
    });
  });

  it('forwards and executes reviewProcessedMessage function for each message', async () => {
    const msgCount = 3;
    const messages = Array.from({ length: msgCount }, generateMessage);
    const reviewProcessedMessage = jest.fn();

    await act(async () => {
      await renderComponent({
        channelProps: { channel },
        chatClient,
        msgListProps: { messages, reviewProcessedMessage },
      });
    });

    expect(reviewProcessedMessage.mock.calls[0][0].changes[0].id).toMatch('message.date');
    expect(reviewProcessedMessage.mock.calls[0][0].changes[1].id).toBe(messages[0].id);
    expect(reviewProcessedMessage.mock.calls[1][0].changes[0].id).toBe(messages[1].id);
    expect(reviewProcessedMessage.mock.calls[2][0].changes[0].id).toBe(messages[2].id);
  });

  describe('unread messages', () => {
    const timestamp = new Date().getTime();
    const messages = Array.from({ length: 5 }, (_, index) =>
      generateMessage({ created_at: new Date(timestamp + index * 1000).toISOString() }),
    );

    const unread_messages = 2;
    const lastReadMessage = messages[unread_messages];
    const separatorText = `Unread messages`;
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

      window.IntersectionObserver = IntersectionObserverMock;
    });
    afterEach(jest.clearAllMocks);
    afterAll(jest.restoreAllMocks);

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
      expect(screen.queryByTestId(UNREAD_MESSAGES_SEPARATOR_TEST_ID)).toBeInTheDocument();
    });

    it('should display unread messages separator in main msg list', async () => {
      const user = generateUser();
      const messages = Array.from({ length: 5 }).map((_, i) =>
        generateMessage({ created_at: new Date(i + 1000).toISOString() }),
      );
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            messages,
            read: [
              {
                last_read: messages[2].created_at,
                last_read_message_id: messages[2].id,
                unread_messages: 2,
                user,
              },
            ],
          },
        ],
        customUser: user,
      });

      const markReadSpy = jest.spyOn(channel, 'markRead').mockResolvedValue(false);

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      expect(screen.queryByTestId(UNREAD_MESSAGES_SEPARATOR_TEST_ID)).toBeInTheDocument();
      markReadSpy.mockRestore();
    });

    it('should not display unread messages separator in read main msg list', async () => {
      const user = generateUser();
      const messages = Array.from({ length: 5 }).map((_, i) =>
        generateMessage({ created_at: new Date(i + 1000).toISOString() }),
      );

      const lastMessage = messages.slice(-1)[0];
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            messages,
            read: [
              {
                last_read: lastMessage.created_at,
                last_read_message_id: lastMessage.id,
                unread_messages: 0,
                user,
              },
            ],
          },
        ],
        customUser: user,
      });

      const markReadSpy = jest.spyOn(channel, 'markRead').mockResolvedValue(false);

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: { messages },
        });
      });

      expect(
        screen.queryByTestId(UNREAD_MESSAGES_SEPARATOR_TEST_ID),
      ).not.toBeInTheDocument();
      markReadSpy.mockRestore();
    });

    it('should not display unread messages separator in threads', async () => {
      const user = generateUser();
      const messages = Array.from({ length: 5 }).map((_, i) =>
        generateMessage({ created_at: new Date(i + 1000).toISOString() }),
      );
      const parentMsg = messages[4];
      const lastReadMessage = messages[3];
      const replies = Array.from({ length: 3 }).map(() =>
        generateMessage({
          created_at: new Date(
            new Date(parentMsg.created_at).getTime() + 1000 + 1,
          ).toISOString(),
          parent_id: parentMsg.id,
        }),
      );
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            messages,
            read: [
              {
                last_read: lastReadMessage.created_at,
                last_read_message_id: lastReadMessage.id,
                unread_messages: 1,
                user,
              },
            ],
          },
        ],
        customUser: user,
      });

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          msgListProps: {
            disableDateSeparator: true,
            messages: replies,
            threadList: true,
          },
        });
      });

      expect(
        screen.queryByTestId(UNREAD_MESSAGES_SEPARATOR_TEST_ID),
      ).not.toBeInTheDocument();
    });

    it('should display custom unread messages separator when channel is marked unread', async () => {
      const customUnreadMessagesSeparatorText = 'CustomUnreadMessagesSeparator';
      const UnreadMessagesSeparator = () => (
        <div>{customUnreadMessagesSeparatorText}</div>
      );
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          components: { UnreadMessagesSeparator },
          msgListProps: { messages },
        });
      });

      expect(
        screen.queryByText(customUnreadMessagesSeparatorText),
      ).not.toBeInTheDocument();

      await act(() => {
        dispatchMarkUnreadForChannel({ channel, client });
      });
      expect(screen.getByText(customUnreadMessagesSeparatorText)).toBeInTheDocument();
    });

    it('should not display custom unread messages separator when last read message is the newest channel message', async () => {
      const customUnreadMessagesSeparatorText = 'CustomUnreadMessagesSeparator';
      const UnreadMessagesSeparator = () => (
        <div>{customUnreadMessagesSeparatorText}</div>
      );
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();

      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient: client,
          components: { UnreadMessagesSeparator },
          msgListProps: { messages },
        });
      });

      expect(
        screen.queryByText(customUnreadMessagesSeparatorText),
      ).not.toBeInTheDocument();

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
      expect(screen.queryByText(customUnreadMessagesSeparatorText)).toBeInTheDocument();
    });

    describe('notification', () => {
      const UNREAD_MESSAGES_NOTIFICATION_TEST_ID = 'unread-messages-notification';
      const observerEntriesScrolledBelowSeparator = [
        { boundingClientRect: { bottom: -1 }, isIntersecting: false },
      ];
      const observerEntriesScrolledAboveSeparator = [
        { boundingClientRect: { bottom: 1 }, isIntersecting: false },
      ];

      const setupTest = async ({
        channelProps = {},
        components = {},
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
            components,
            msgListProps: { messages, ...msgListProps },
          });
        });

        await act(() => {
          dispatchMarkUnreadForChannel({
            channel,
            client,
            payload: dispatchMarkUnreadPayload,
          });
        });

        await act(() => {
          invokeIntersectionCb(entries);
        });
      };

      it('should not display unread messages notification when scrolled to unread messages separator', async () => {
        await setupTest({ entries: [{ isIntersecting: true }] });
        expect(
          screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it.each([
        [
          'should not',
          "top edge is below container's visible bottom",
          observerEntriesScrolledAboveSeparator,
          undefined,
        ],
        [
          'should',
          "bottom edge is above container's visible top",
          observerEntriesScrolledBelowSeparator,
          undefined,
        ],
        [
          'should',
          "top edge is below container's visible bottom when showUnreadNotificationAlways enabled",
          observerEntriesScrolledAboveSeparator,
          { showUnreadNotificationAlways: true },
        ],
        [
          'should not',
          "top edge is below container's visible bottom when showUnreadNotificationAlways disabled",
          observerEntriesScrolledAboveSeparator,
          { showUnreadNotificationAlways: false },
        ],
        [
          'should',
          "bottom edge is above container's visible top when showUnreadNotificationAlways disabled",
          observerEntriesScrolledBelowSeparator,
          { showUnreadNotificationAlways: false },
        ],
        [
          'should',
          "bottom edge is above container's visible top when showUnreadNotificationAlways enabled",
          observerEntriesScrolledBelowSeparator,
          { showUnreadNotificationAlways: true },
        ],
      ])(
        '%s display unread messages notification when unread messages separator %s',
        async (expected, __, entries, msgListProps) => {
          await setupTest({
            entries,
            msgListProps,
          });
          if (expected === 'should') {
            await waitFor(() =>
              expect(
                screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
              ).toBeInTheDocument(),
            );
          } else {
            await waitFor(() =>
              expect(
                screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
              ).not.toBeInTheDocument(),
            );
          }
        },
      );

      it('should display custom unread messages notification', async () => {
        const customUnreadMessagesNotificationText = nanoid();
        const UnreadMessagesNotification = () => (
          <div data-testid={customUnreadMessagesNotificationText}>aaa</div>
        );
        await setupTest({
          components: {
            UnreadMessagesNotification,
          },
          entries: observerEntriesScrolledBelowSeparator,
        });

        await waitFor(() =>
          expect(
            screen.getByTestId(customUnreadMessagesNotificationText),
          ).toBeInTheDocument(),
        );
      });

      it('should not display unread messages notification when unread count is 0', async () => {
        await setupTest({
          dispatchMarkUnreadPayload: { unread_messages: 0 },
          entries: observerEntriesScrolledBelowSeparator,
        });
        expect(
          screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('should not display unread messages notification IntersectionObserver is undefined', async () => {
        window.IntersectionObserver = undefined;
        await setupTest({ entries: observerEntriesScrolledBelowSeparator });
        expect(
          screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('should not display unread messages notification in thread', async () => {
        await setupTest({
          entries: observerEntriesScrolledBelowSeparator,
          msgListProps: { threadList: true },
        });
        expect(
          screen.queryByTestId(UNREAD_MESSAGES_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });
    });

    describe('ScrollToLatestMessageButton and NewMessageNotification', () => {
      const NEW_MESSAGE_NOTIFICATION_TEST_ID = 'message-notification';
      const SCROLL_TO_LATEST_MESSAGE_TEST_ID = 'scroll-to-latest-message-button';
      const NEW_MESSAGE_COUNTER_TEST_ID = 'unread-message-notification-counter';

      it('ScrollToLatestMessageButton does not reflect the channel unread UI state', async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await act(() => {
          renderComponent({
            channelProps: {
              channel,
            },
            chatClient: client,
            msgListProps: { messages },
          });
        });

        const scrollButton = screen.queryByTestId(SCROLL_TO_LATEST_MESSAGE_TEST_ID);
        const newMessageNotification = screen.queryByTestId(
          NEW_MESSAGE_NOTIFICATION_TEST_ID,
        );
        expect(scrollButton || newMessageNotification).toBeTruthy();
        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();

        await act(() => {
          dispatchMarkUnreadForChannel({ channel, client });
        });

        expect(screen.queryByTestId(NEW_MESSAGE_COUNTER_TEST_ID)).not.toBeInTheDocument();
      });

      it('ScrollToLatestMessageButton does not reflect the channel unread state in a thread', async () => {
        const {
          channels: [channel],
          client,
        } = await initClientWithChannels();

        await act(() => {
          renderComponent({
            channelProps: {
              channel,
            },
            chatClient: client,
            msgListProps: { messages, threadList: true },
          });
        });

        const scrollButton = screen.queryByTestId(SCROLL_TO_LATEST_MESSAGE_TEST_ID);
        const newMessageNotification = screen.queryByTestId(
          NEW_MESSAGE_NOTIFICATION_TEST_ID,
        );
        expect(scrollButton || newMessageNotification).toBeTruthy();
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

  describe('list wrapper and list item overrides', () => {
    it('uses provided list wrapper', async () => {
      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient,
          components: {
            MessageListWrapper: (props) => (
              <div data-testid='message-list-wrapper' {...props} />
            ),
          },
        });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('message-list-wrapper')).toBeInTheDocument();
      });
    });

    it('uses provided list item wrapper', async () => {
      await act(() => {
        renderComponent({
          channelProps: { channel },
          chatClient,
          components: {
            MessageListItem: (props) => (
              <div data-testid='message-list-item' {...props} />
            ),
            MessageListWrapper: (props) => (
              <div data-testid='message-list-wrapper' {...props} />
            ),
          },
        });
      });

      await waitFor(() => {
        const item = screen.queryByTestId('message-list-item');
        expect(item).toBeInTheDocument();
        expect(item.dataset.index).toBeDefined();
        expect(screen.queryByText(message1.text)).toBeInTheDocument();
      });
    });
  });
});
