import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { MessageActionsBox } from '../MessageActionsBox';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { MessageProvider } from '../../../context/MessageContext';
import { TranslationProvider } from '../../../context/TranslationContext';

import {
  dispatchNotificationMarkUnread,
  generateMessage,
  generateUser,
  initClientWithChannels,
} from '../../../mock-builders';
import { Message } from '../../Message';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import { ChatProvider } from '../../../context';

expect.extend(toHaveNoViolations);

const getMessageActionsMock = jest.fn(() => []);

const defaultMessageContextValue = {
  message: generateMessage(),
  messageListRect: {},
};

async function renderComponent(boxProps, messageContext = {}) {
  const { client } = await initClientWithChannels();
  return render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t: (key) => key }}>
        <ChannelActionProvider
          value={{
            openThread: jest.fn(),
            removeMessage: jest.fn(),
            updateMessage: jest.fn(),
          }}
        >
          <MessageProvider
            value={{ ...defaultMessageContextValue, ...messageContext, message: boxProps.message }}
          >
            <MessageActionsBox {...boxProps} getMessageActions={getMessageActionsMock} />
          </MessageProvider>
        </ChannelActionProvider>
      </TranslationProvider>
    </ChatProvider>,
  );
}

describe('MessageActionsBox', () => {
  afterEach(jest.clearAllMocks);

  it('should not show any of the action buttons if no actions are returned by getMessageActions', async () => {
    const { container, queryByText } = await renderComponent({});
    expect(queryByText('Flag')).not.toBeInTheDocument();
    expect(queryByText('Mute')).not.toBeInTheDocument();
    expect(queryByText('Unmute')).not.toBeInTheDocument();
    expect(queryByText('Edit Message')).not.toBeInTheDocument();
    expect(queryByText('Delete')).not.toBeInTheDocument();
    expect(queryByText('Pin')).not.toBeInTheDocument();
    expect(queryByText('Unpin')).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handleFlag prop if the flag button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['flag']);
    const handleFlag = jest.fn();
    const { container, getByText } = await renderComponent({ handleFlag });
    fireEvent.click(getByText('Flag'));
    expect(handleFlag).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handleMute prop if the mute button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['mute']);
    const handleMute = jest.fn();
    const { container, getByText } = await renderComponent({
      handleMute,
      isUserMuted: () => false,
    });
    fireEvent.click(getByText('Mute'));
    expect(handleMute).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handleMute prop if the unmute button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['mute']);
    const handleMute = jest.fn();
    const { container, getByText } = await renderComponent({
      handleMute,
      isUserMuted: () => true,
    });
    fireEvent.click(getByText('Unmute'));
    expect(handleMute).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handleEdit prop if the edit button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['edit']);
    const handleEdit = jest.fn();
    const { container, getByText } = await renderComponent({ handleEdit });
    fireEvent.click(getByText('Edit Message'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handleDelete prop if the delete button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['delete']);
    const handleDelete = jest.fn();
    const { container, getByText } = await renderComponent({ handleDelete });
    fireEvent.click(getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handlePin prop if the pin button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['pin']);
    const handlePin = jest.fn();
    const message = generateMessage({ pinned: false });
    const { container, getByText } = await renderComponent({ handlePin, message });
    fireEvent.click(getByText('Pin'));
    expect(handlePin).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should call the handlePin prop if the unpin button is clicked', async () => {
    getMessageActionsMock.mockImplementationOnce(() => ['pin']);
    const handlePin = jest.fn();
    const message = generateMessage({ pinned: true });
    const { container, getByText } = await renderComponent({ handlePin, message });
    fireEvent.click(getByText('Unpin'));
    expect(handlePin).toHaveBeenCalledTimes(1);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('mark message unread', () => {
    afterEach(jest.restoreAllMocks);
    const ACTION_TEXT = 'Mark as unread';
    const TOGGLE_ACTIONS_BUTTON_TEST_ID = 'message-actions';
    const me = generateUser();
    const otherUser = generateUser();
    const message = generateMessage({ user: otherUser });
    const lastReceivedId = message.id;
    const read = [
      {
        last_read: new Date(),
        last_read_message_id: message.id, // optional
        unread_messages: 0,
        user: me,
      },
    ];
    const own_capabilities = [
      'ban-channel-members',
      'connect-events',
      'create-call',
      'delete-any-message',
      'delete-channel',
      'delete-own-message',
      'flag-message',
      'freeze-channel',
      'join-call',
      'join-channel',
      'leave-channel',
      'mute-channel',
      'pin-message',
      'quote-message',
      'read-events',
      'search-messages',
      'send-custom-events',
      'send-links',
      'send-message',
      'send-reaction',
      'send-reply',
      'send-typing-events',
      'set-channel-cooldown',
      'skip-slow-mode',
      'typing-events',
      'update-any-message',
      'update-channel',
      'update-channel-members',
      'update-own-message',
      'upload-file',
    ];
    const renderMarkUnreadUI = async ({ channelProps, chatProps, messageProps }) =>
      await act(() => {
        render(
          <Chat {...chatProps}>
            <Channel {...channelProps}>
              <Message
                lastReceivedId={lastReceivedId}
                message={message}
                threadList={false}
                {...messageProps}
              />
            </Channel>
          </Chat>,
        );
      });

    it('should not be displayed as an option in channels without "read-events" capability', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: { own_capabilities: own_capabilities.filter((c) => c !== 'read-events') },
            messages: [message],
            read,
          },
        ],
        customUser: me,
      });

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });
      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
    });

    it('should be displayed as an option for own messages', async () => {
      const myMessage = { ...message, user: me };
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: { own_capabilities },
            messages: [myMessage],
            read,
          },
        ],
        customUser: me,
      });

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message: myMessage },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });
      expect(screen.queryByText(ACTION_TEXT)).toBeInTheDocument();
    });

    it('should not be displayed as an option for thread messages', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message, threadList: true },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });
      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
    });

    it('should be displayed as an option for message already marked unread', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message },
      });

      await act(() => {
        dispatchNotificationMarkUnread({
          channel,
          client,
          payload: {
            first_unread_message_id: message.id,
            last_read: new Date(new Date(message.created_at).getTime() - 1000),
            last_read_message_id: new Date().toISOString(), // any other message id always unique
            unread_messages: 1,
            user: client.user,
          },
        });
      });

      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });
      expect(screen.queryByText(ACTION_TEXT)).toBeInTheDocument();
    });

    it('should not be displayed as an option for message without id', async () => {
      jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
      const messageWithoutID = { ...message, id: undefined };
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: { own_capabilities },
            messages: [messageWithoutID],
            read,
          },
        ],
        customUser: me,
      });
      jest.spyOn(channel, 'markUnread');

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message: messageWithoutID },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });
      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
    });

    it('should be displayed as an option for messages other than message marked unread', async () => {
      const otherMsg = generateMessage({
        created_at: new Date(new Date(message.created_at).getTime() + 1000),
      });
      const read = [
        {
          first_unread_message_id: message.id,
          last_read: new Date(new Date(message.created_at).getTime() - 1000),
          // last_read_message_id: message.id, // optional
          unread_messages: 2,
          user: me,
        },
      ];
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: { own_capabilities },
            messages: [message, otherMsg],
            read,
          },
        ],
        customUser: me,
      });

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <Message lastReceivedId={otherMsg.id} message={message} threadList={false} />
              <Message lastReceivedId={otherMsg.id} message={otherMsg} threadList={false} />
            </Channel>
          </Chat>,
        );
      });

      const [actionsBox1, actionsBox2] = screen.getAllByTestId('message-actions-box');
      expect(actionsBox1).toHaveTextContent(ACTION_TEXT);
      expect(actionsBox2).toHaveTextContent(ACTION_TEXT);
    });

    it('should be displayed and execute API request', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });
      jest.spyOn(channel, 'markUnread');

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
        fireEvent.click(screen.getByText(ACTION_TEXT));
      });
      expect(channel.markUnread).toHaveBeenCalledWith(
        expect.objectContaining({ message_id: message.id }),
      );
    });

    it('should allow mark message unread and notify with custom success notification', async () => {
      const getMarkMessageUnreadSuccessNotification = jest.fn();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });
      jest.spyOn(channel, 'markUnread');

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { getMarkMessageUnreadSuccessNotification, message },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
        fireEvent.click(screen.getByText(ACTION_TEXT));
      });
      expect(getMarkMessageUnreadSuccessNotification).toHaveBeenCalledWith(
        expect.objectContaining(message),
      );
    });

    it('should allow mark message unread and notify with custom error notification', async () => {
      const getMarkMessageUnreadErrorNotification = jest.fn();
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });
      jest.spyOn(channel, 'markUnread').mockRejectedValueOnce();

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { getMarkMessageUnreadErrorNotification, message },
      });
      await act(() => {
        fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
        fireEvent.click(screen.getByText(ACTION_TEXT));
      });
      expect(getMarkMessageUnreadErrorNotification).toHaveBeenCalledWith(
        expect.objectContaining(message),
      );
    });
  });
});
