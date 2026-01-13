import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';

import { MessageActions } from '../MessageActions';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';

import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  initClientWithChannels,
  mockTranslationContext,
} from '../../../mock-builders';

import { Message } from '../../Message';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';

expect.extend(toHaveNoViolations);

const alice = generateUser({ name: 'alice' });
const TOGGLE_ACTIONS_BUTTON_TEST_ID = 'message-actions-toggle-button';
const MESSAGE_ACTIONS_HOST_TEST_ID = 'message-actions-host';
const dialogOverlayTestId = 'str-chat__dialog-overlay';
const threadActionTestId = 'thread-action';
const reactionActionTestId = 'message-reaction-action';
const reactionSelectorTestId = 'reaction-selector';

const defaultMessageContextValue = {
  getMessageActions: () => [
    'delete',
    'edit',
    'flag',
    'mute',
    'pin',
    'quote',
    'react',
    'reply',
  ],
  handleDelete: jest.fn(),
  handleEdit: jest.fn(),
  handleFlag: jest.fn(),
  handleMarkUnread: jest.fn(),
  handleMute: jest.fn(),
  handleOpenThread: jest.fn(),
  handlePin: jest.fn(),
  isMyMessage: () => false,
  message: generateMessage(),
};

const toggleOpenMessageActions = async (index = 0) => {
  await act(async () => {
    const buttons = screen.getAllByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID);
    await fireEvent.click(buttons[index]);
  });
};

async function renderMessageActions({
  channelConfig = {},
  channelStateOpts = {},
  chatClient,
  customChatContext = {},
  customMessageContext = {},
  messageActionsProps = {},
} = {}) {
  const client = chatClient || (await getTestClientWithUser(alice));
  const channel = generateChannel({
    getConfig: () => channelConfig,
    state: { membership: {} },
    ...channelStateOpts,
  });

  return render(
    <ChatProvider value={{ client, ...customChatContext }}>
      <DialogManagerProvider id='message-actions-dialog-provider'>
        <ChannelStateProvider value={{ channel, channelConfig, ...channelStateOpts }}>
          <ChannelActionProvider
            value={{
              openThread: jest.fn(),
              removeMessage: jest.fn(),
              updateMessage: jest.fn(),
            }}
          >
            <TranslationProvider value={mockTranslationContext}>
              <ComponentProvider value={{}}>
                <MessageProvider
                  value={{ ...defaultMessageContextValue, ...customMessageContext }}
                >
                  <MessageActions {...messageActionsProps} />
                </MessageProvider>
              </ComponentProvider>
            </TranslationProvider>
          </ChannelActionProvider>
        </ChannelStateProvider>
      </DialogManagerProvider>
    </ChatProvider>,
  );
}

describe('<MessageActions />', () => {
  beforeEach(jest.clearAllMocks);

  describe('Rendering and visibility', () => {
    it('should not render when there are no actions available', async () => {
      const { queryByTestId } = await renderMessageActions({
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
          messageActionSet: [],
        },
      });
      expect(queryByTestId(MESSAGE_ACTIONS_HOST_TEST_ID)).not.toBeInTheDocument();
    });

    it('should not render when message is not set', async () => {
      const { queryByTestId } = await renderMessageActions({
        customMessageContext: {
          message: {},
        },
      });
      expect(queryByTestId(MESSAGE_ACTIONS_HOST_TEST_ID)).not.toBeInTheDocument();
    });

    it.each([
      ['type', 'error'],
      ['type', 'system'],
      ['type', 'ephemeral'],
      ['status', 'failed'],
      ['status', 'sending'],
    ])('should not render when message is of %s %s', async (key, value) => {
      const message = generateMessage({ [key]: value, user: alice });
      const { queryByTestId } = await renderMessageActions({
        customMessageContext: { message },
      });
      expect(queryByTestId(MESSAGE_ACTIONS_HOST_TEST_ID)).not.toBeInTheDocument();
    });

    it('should not render when message is parent message in a thread', async () => {
      const { queryByTestId } = await renderMessageActions({
        customMessageContext: {
          initialMessage: true,
        },
      });
      expect(queryByTestId(MESSAGE_ACTIONS_HOST_TEST_ID)).not.toBeInTheDocument();
    });

    it('should render correctly when not open', async () => {
      const { container } = await renderMessageActions();
      expect(container.querySelector('.str-chat__message-options')).toBeInTheDocument();
      const button = screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should apply active class when dropdown is open', async () => {
      const { container } = await renderMessageActions();
      const actionsHost = container.querySelector('.str-chat__message-options');
      expect(actionsHost).not.toHaveClass('str-chat__message-options--active');

      await toggleOpenMessageActions();

      expect(actionsHost).toHaveClass('str-chat__message-options--active');
    });
  });

  describe('Dropdown actions', () => {
    it('should open dropdown when toggle button is clicked', async () => {
      await renderMessageActions();
      expect(screen.queryByTestId(dialogOverlayTestId)).not.toBeInTheDocument();

      await toggleOpenMessageActions();

      expect(screen.getByTestId(dialogOverlayTestId)).toBeInTheDocument();
      expect(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID)).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('should close dropdown when toggle button is clicked again', async () => {
      await renderMessageActions();
      await toggleOpenMessageActions();
      expect(screen.getByTestId(dialogOverlayTestId)).toBeInTheDocument();

      await toggleOpenMessageActions();

      await waitFor(() => {
        expect(screen.queryByTestId(dialogOverlayTestId)).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when overlay is clicked', async () => {
      await renderMessageActions();
      await toggleOpenMessageActions();
      const dialogOverlay = screen.getByTestId(dialogOverlayTestId);

      await act(async () => {
        await fireEvent.click(dialogOverlay);
      });

      expect(screen.queryByTestId(dialogOverlayTestId)).not.toBeInTheDocument();
    });

    it('should close dropdown when Escape key is pressed', async () => {
      await renderMessageActions();
      await toggleOpenMessageActions();
      expect(screen.getByTestId(dialogOverlayTestId)).toBeInTheDocument();

      await act(async () => {
        await fireEvent.keyUp(document, { charCode: 27, code: 'Escape', key: 'Escape' });
      });

      expect(screen.queryByTestId(dialogOverlayTestId)).not.toBeInTheDocument();
    });
  });

  describe('Dropdown action buttons', () => {
    it('should render and call handleDelete when Delete button is clicked', async () => {
      const handleDelete = jest.fn();
      const message = generateMessage({ user: alice });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        customMessageContext: { handleDelete, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(getByText('Delete'));
      });

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('should render and call handleEdit when Edit Message button is clicked', async () => {
      const handleEdit = jest.fn();
      const message = generateMessage({ user: alice });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'update-own-message': true },
        },
        customMessageContext: { handleEdit, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(getByText('Edit Message'));
      });

      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('should render and call handleFlag when Flag button is clicked', async () => {
      const handleFlag = jest.fn();
      const otherUser = generateUser();
      const message = generateMessage({ user: otherUser });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'flag-message': true },
        },
        customMessageContext: { handleFlag, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(getByText('Flag'));
      });

      expect(handleFlag).toHaveBeenCalledTimes(1);
    });

    it('should render and call handleMute when Mute button is clicked', async () => {
      const handleMute = jest.fn();
      const otherUser = generateUser();
      const message = generateMessage({ user: otherUser });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'mute-channel': true },
        },
        customMessageContext: { handleMute, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(getByText('Mute'));
      });

      expect(handleMute).toHaveBeenCalledTimes(1);
    });

    it('should show Unmute text when user is muted', async () => {
      const otherUser = generateUser();
      const message = generateMessage({ user: otherUser });
      const handleMute = jest.fn();
      const chatClient = await getTestClientWithUser(alice);
      const mutes = [{ target: otherUser, user: alice }];

      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'mute-channel': true },
        },
        chatClient,
        customChatContext: { mutes },
        customMessageContext: { handleMute, message },
      });
      await toggleOpenMessageActions();

      expect(getByText('Unmute')).toBeInTheDocument();
    });

    it('should render and call handlePin when Pin button is clicked', async () => {
      const handlePin = jest.fn();
      const message = generateMessage({ pinned: false });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'pin-message': true },
        },
        customMessageContext: { handlePin, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(getByText('Pin'));
      });

      expect(handlePin).toHaveBeenCalledTimes(1);
    });

    it('should show Unpin text when message is pinned', async () => {
      const message = generateMessage({ pinned: true });
      const { getByText } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'pin-message': true },
        },
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      expect(getByText('Unpin')).toBeInTheDocument();
    });

    it('should set quoted message when Quote button is clicked', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();
      const message = generateMessage({ user: client.user });
      const setQuotedMessageSpy = jest.spyOn(channel.messageComposer, 'setQuotedMessage');

      await act(async () => {
        await render(
          <ChatProvider value={{ client }}>
            <DialogManagerProvider id='message-actions-dialog-provider'>
              <ChannelStateProvider
                value={{
                  channel,
                  channelCapabilities: { 'quote-message': true },
                }}
              >
                <ChannelActionProvider
                  value={{
                    openThread: jest.fn(),
                    removeMessage: jest.fn(),
                    updateMessage: jest.fn(),
                  }}
                >
                  <TranslationProvider value={mockTranslationContext}>
                    <ComponentProvider value={{}}>
                      <MessageProvider
                        value={{
                          ...defaultMessageContextValue,
                          message,
                        }}
                      >
                        <MessageActions />
                      </MessageProvider>
                    </ComponentProvider>
                  </TranslationProvider>
                </ChannelActionProvider>
              </ChannelStateProvider>
            </DialogManagerProvider>
          </ChatProvider>,
        );
      });

      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText('Quote'));
      });

      expect(setQuotedMessageSpy).toHaveBeenCalledWith(message);
    });
  });

  describe('Quick actions', () => {
    it('should display thread (reply) action when channel has replies enabled', async () => {
      const { getByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reply': true },
          channelConfig: { replies: true },
        },
      });

      expect(getByTestId(threadActionTestId)).toBeInTheDocument();
    });

    it('should not display thread action when channel does not have replies enabled', async () => {
      const { queryByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelConfig: { replies: false },
        },
      });

      expect(queryByTestId(threadActionTestId)).not.toBeInTheDocument();
    });

    it('should not display thread action when message is in a thread', async () => {
      const message = generateMessage({ parent_id: 'parent-123' });
      const { queryByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reply': true },
          channelConfig: { replies: true },
        },
        customMessageContext: {
          message,
        },
      });

      expect(queryByTestId(threadActionTestId)).not.toBeInTheDocument();
    });

    it('should call handleOpenThread when Reply button is clicked', async () => {
      const handleOpenThread = jest.fn();
      const { getByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reply': true },
          channelConfig: { replies: true },
        },
        customMessageContext: {
          handleOpenThread,
        },
      });

      await act(async () => {
        await fireEvent.click(getByTestId(threadActionTestId));
      });

      expect(handleOpenThread).toHaveBeenCalledTimes(1);
    });

    it('should display reaction action when channel has reactions enabled', async () => {
      const { getByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });

      expect(getByTestId(reactionActionTestId)).toBeInTheDocument();
    });

    it('should not display reaction action when channel has reactions disabled', async () => {
      const { queryByTestId } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': false },
        },
      });

      expect(queryByTestId(reactionActionTestId)).not.toBeInTheDocument();
    });
  });

  describe('Reaction selector', () => {
    it('should not render ReactionSelector until reaction button is clicked', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });

      expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(reactionActionTestId));
      });

      expect(screen.getByTestId(reactionSelectorTestId)).toBeInTheDocument();
    });

    it('should close ReactionSelector when dialog overlay is clicked', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });

      await act(async () => {
        await fireEvent.click(screen.getByTestId(reactionActionTestId));
      });

      expect(screen.getByTestId(reactionSelectorTestId)).toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(dialogOverlayTestId));
      });

      expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
    });

    it('should close ReactionSelector when Escape key is pressed', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });

      await act(async () => {
        await fireEvent.click(screen.getByTestId(reactionActionTestId));
      });

      expect(screen.getByTestId(reactionSelectorTestId)).toBeInTheDocument();

      await act(async () => {
        await fireEvent.keyUp(document, { charCode: 27, code: 'Escape', key: 'Escape' });
      });

      expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
    });

    it('should apply active class when ReactionSelector is open', async () => {
      const { container } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });

      const actionsHost = container.querySelector('.str-chat__message-options');
      expect(actionsHost).not.toHaveClass('str-chat__message-options--active');

      await act(async () => {
        await fireEvent.click(screen.getByTestId(reactionActionTestId));
      });

      expect(actionsHost).toHaveClass('str-chat__message-options--active');
    });
  });

  describe('Mark as unread action', () => {
    const ACTION_TEXT = 'Mark as unread';
    const me = generateUser();
    const otherUser = generateUser();
    const message = generateMessage({ user: otherUser });
    const lastReceivedId = message.id;
    const read = [
      {
        last_read: new Date(),
        last_read_message_id: message.id,
        unread_messages: 0,
        user: me,
      },
    ];
    const own_capabilities = [
      'ban-channel-members',
      'connect-events',
      'delete-any-message',
      'delete-own-message',
      'flag-message',
      'mute-channel',
      'pin-message',
      'quote-message',
      'read-events',
      'send-message',
      'send-reaction',
      'send-reply',
      'update-any-message',
      'update-own-message',
    ];

    const renderMarkUnreadUI = async ({ channelProps, chatProps, messageProps }) =>
      await act(async () => {
        await render(
          <Chat {...chatProps}>
            <Channel {...channelProps}>
              <DialogManagerProvider id='message-actions-dialog-provider'>
                <Message
                  lastReceivedId={lastReceivedId}
                  message={message}
                  threadList={false}
                  {...messageProps}
                />
              </DialogManagerProvider>
            </Channel>
          </Chat>,
        );
      });

    afterEach(jest.restoreAllMocks);

    it('should not be displayed without "read-events" capability', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: {
              own_capabilities: own_capabilities.filter((c) => c !== 'read-events'),
            },
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
      await toggleOpenMessageActions();

      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
    });

    it('should be displayed for own messages', async () => {
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
      await toggleOpenMessageActions();

      expect(screen.queryByText(ACTION_TEXT)).toBeInTheDocument();
    });

    it('should not be displayed for thread messages', async () => {
      const threadMessage = generateMessage({ parent_id: 'parent-123', user: otherUser });
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          { channel: { own_capabilities }, messages: [threadMessage], read },
        ],
        customUser: me,
      });

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message: threadMessage, threadList: true },
      });
      await toggleOpenMessageActions();

      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
    });

    it('should call channel.markUnread when Mark as unread button is clicked', async () => {
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
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      expect(channel.markUnread).toHaveBeenCalledWith(
        expect.objectContaining({ message_id: message.id }),
      );
    });

    it('should call custom success notification on successful mark unread', async () => {
      const getMarkMessageUnreadSuccessNotification = jest.fn();
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
        messageProps: { getMarkMessageUnreadSuccessNotification, message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      expect(getMarkMessageUnreadSuccessNotification).toHaveBeenCalledWith(
        expect.objectContaining(message),
      );
    });

    it('should call custom error notification on failed mark unread', async () => {
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
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      expect(getMarkMessageUnreadErrorNotification).toHaveBeenCalledWith(
        expect.objectContaining(message),
      );
    });
  });

  describe('Custom message action sets', () => {
    it('should render custom action components', async () => {
      const CustomAction = () => <button data-testid='custom-action'>Custom</button>;
      const customMessageActionSet = [
        {
          Component: CustomAction,
          placement: 'dropdown',
          type: 'custom',
        },
      ];

      await renderMessageActions({
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
          messageActionSet: customMessageActionSet,
        },
      });
      await toggleOpenMessageActions();

      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });

    it('should support custom quick actions', async () => {
      const CustomQuickAction = () => (
        <button data-testid='custom-quick-action'>Quick</button>
      );
      const customMessageActionSet = [
        {
          Component: CustomQuickAction,
          placement: 'quick',
          type: 'customQuick',
        },
      ];

      await renderMessageActions({
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
          messageActionSet: customMessageActionSet,
        },
      });

      expect(screen.getByTestId('custom-quick-action')).toBeInTheDocument();
    });

    it('should allow disabling base filter', async () => {
      const message = generateMessage({ status: 'failed' });
      const { queryByTestId } = await renderMessageActions({
        customMessageContext: { message },
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
        },
      });

      // Should render even for failed messages when filter is disabled
      expect(queryByTestId(MESSAGE_ACTIONS_HOST_TEST_ID)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations when closed', async () => {
      const { container } = await renderMessageActions();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when dropdown is open', async () => {
      const { container } = await renderMessageActions();
      await toggleOpenMessageActions();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper aria attributes', async () => {
      await renderMessageActions();
      const button = screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID);

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-label', 'Open Message Actions Menu');

      await toggleOpenMessageActions();

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have role=listbox for dropdown actions list', async () => {
      await renderMessageActions();
      await toggleOpenMessageActions();

      const actionsList = screen.getByRole('listbox', { name: 'Message Options' });
      expect(actionsList).toBeInTheDocument();
    });
  });
});
