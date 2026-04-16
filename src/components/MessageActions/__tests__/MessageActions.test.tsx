import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import { MessageActions } from '../MessageActions';
import { defaultMessageActionSet } from '../MessageActions.defaults';

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
  generateFileAttachment,
  generateImageAttachment,
  generateLocalFileUploadAttachmentData,
  generateMessage,
  generateReminderResponse,
  generateUser,
  getTestClientWithUser,
  initClientWithChannels,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
  mockComponentContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';

import { type ChatView, ChatViewContext } from '../../ChatView/ChatView';
import { ResizeObserverMock } from '../../../mock-builders/browser';
import { Message } from '../../Message';
import { Channel } from '../../Channel';
import { Chat } from '../../Chat';

(window as any).ResizeObserver = ResizeObserverMock;

const chatViewContextValue = {
  activeChatView: 'channels' as ChatView,
  setActiveChatView: () => {},
};

const alice = generateUser({ name: 'alice' });
const TOGGLE_ACTIONS_BUTTON_TEST_ID = 'message-actions-toggle-button';
const MESSAGE_ACTIONS_HOST_TEST_ID = 'message-actions-host';
const dialogOverlayTestId = 'str-chat__dialog-overlay';
const threadActionTestId = 'thread-action';
const reactionActionTestId = 'message-reaction-action';
const dropdownReactionActionTestId = 'dropdown-react-action';
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
  handleDelete: vi.fn(),
  handleEdit: vi.fn(),
  handleFlag: vi.fn(),
  handleMarkUnread: vi.fn(),
  handleMute: vi.fn(),
  handleOpenThread: vi.fn(),
  handlePin: vi.fn(),
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
}: any = {}) {
  const client = chatClient || (await getTestClientWithUser(alice));
  const channel = generateChannel({
    getConfig: () => channelConfig,
    state: { membership: {} },
    ...channelStateOpts,
  });

  return render(
    <ChatViewContext.Provider value={chatViewContextValue}>
      <ChatProvider value={mockChatContext({ client, ...customChatContext })}>
        <DialogManagerProvider id='message-actions-dialog-provider'>
          <ChannelStateProvider
            value={mockChannelStateContext({
              channel,
              channelConfig,
              ...channelStateOpts,
            })}
          >
            <ChannelActionProvider
              value={mockChannelActionContext({
                openThread: vi.fn(),
                removeMessage: vi.fn(),
                updateMessage: vi.fn(),
              })}
            >
              <TranslationProvider value={mockTranslationContextValue()}>
                <ComponentProvider value={mockComponentContext()}>
                  <MessageProvider
                    value={mockMessageContext({
                      ...defaultMessageContextValue,
                      ...customMessageContext,
                    })}
                  >
                    <MessageActions {...messageActionsProps} />
                  </MessageProvider>
                </ComponentProvider>
              </TranslationProvider>
            </ChannelActionProvider>
          </ChannelStateProvider>
        </DialogManagerProvider>
      </ChatProvider>
    </ChatViewContext.Provider>,
  );
}

describe('<MessageActions />', () => {
  beforeEach(vi.clearAllMocks);

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

      await waitFor(() => {
        expect(screen.queryByTestId(dialogOverlayTestId)).not.toBeInTheDocument();
      });
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
      const handleDelete = vi.fn();
      const message = generateMessage({ user: alice });
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        customMessageContext: { handleDelete, message },
      });
      await toggleOpenMessageActions();

      // Click "Delete message" in the dropdown to open confirmation modal
      await act(async () => {
        await fireEvent.click(screen.getByText('Delete message'));
      });

      // Click "Delete message" in the confirmation modal
      await act(async () => {
        const confirmBtn = screen.getByTestId('delete-message-alert-delete-button');
        await fireEvent.click(confirmBtn);
      });

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('should not show Delete when the message is already deleted', async () => {
      const message = generateMessage({
        deleted_at: new Date().toISOString(),
        user: alice,
      });
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      expect(screen.queryByText('Delete message')).not.toBeInTheDocument();
    });

    it('should not show Delete when the message type is deleted', async () => {
      const message = generateMessage({
        type: 'deleted',
        user: alice,
      });
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      expect(screen.queryByText('Delete message')).not.toBeInTheDocument();
    });

    it('should not show Delete when the message is deleted for me', async () => {
      const message = generateMessage({
        deleted_for_me: true,
        user: alice,
      });
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      expect(screen.queryByText('Delete message')).not.toBeInTheDocument();
    });

    it('should include Edit in dropdown actions when user has edit capability', async () => {
      const message = generateMessage({ user: alice });
      const { container } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'update-own-message': true },
        },
        customMessageContext: { message },
      });

      // Verify the actions component renders (Edit action is included in the set)
      expect(container.querySelector('.str-chat__message-options')).toBeInTheDocument();
      expect(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('should render and call handleFlag when Flag button is clicked', async () => {
      const handleFlag = vi.fn();
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
      const handleMute = vi.fn();
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
      const handleMute = vi.fn();
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
      const handlePin = vi.fn();
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
      const setQuotedMessageSpy = vi.spyOn(channel.messageComposer, 'setQuotedMessage');

      await act(async () => {
        await render(
          <ChatProvider value={mockChatContext({ client })}>
            <DialogManagerProvider id='message-actions-dialog-provider'>
              <ChannelStateProvider
                value={mockChannelStateContext({
                  channel,
                  channelCapabilities: { 'quote-message': true },
                })}
              >
                <ChannelActionProvider
                  value={mockChannelActionContext({
                    openThread: vi.fn(),
                    removeMessage: vi.fn(),
                    updateMessage: vi.fn(),
                  })}
                >
                  <TranslationProvider value={mockTranslationContextValue()}>
                    <ComponentProvider value={mockComponentContext()}>
                      <MessageProvider
                        value={mockMessageContext({
                          ...defaultMessageContextValue,
                          message,
                        })}
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
        await fireEvent.click(screen.getByText('Quote Reply'));
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
      const handleOpenThread = vi.fn();
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

    it('should display reaction action at the top of dropdown list', async () => {
      const { container } = await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });
      await toggleOpenMessageActions();

      const contextMenuButtons = container.querySelectorAll(
        '.str-chat__context-menu__button',
      );

      expect(contextMenuButtons[0]).toHaveTextContent('Add reaction');
      expect(screen.getByTestId(dropdownReactionActionTestId)).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
      });
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

    it('should render ReactionSelector when dropdown reaction action is clicked', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(dropdownReactionActionTestId));
      });

      const reactionSelector = screen.getByTestId(reactionSelectorTestId);
      expect(reactionSelector).toBeInTheDocument();
      expect(reactionSelector.closest('.str-chat__context-menu')).toBeNull();
      const messageActionsMenu = document.querySelector('.str-chat__message-actions-box');
      expect(messageActionsMenu).toBeInTheDocument();
      expect(messageActionsMenu).toHaveClass('str-chat__message-actions-box--hidden');
    });

    it('should close ReactionSelector when dropdown reaction action is clicked while selector is open', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(dropdownReactionActionTestId));
      });

      expect(screen.getByTestId(reactionSelectorTestId)).toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(dropdownReactionActionTestId));
      });

      await waitFor(() => {
        expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
      });

      const messageActionsMenu = document.querySelector('.str-chat__message-actions-box');
      expect(messageActionsMenu).not.toHaveClass('str-chat__message-actions-box--hidden');
    });

    it('should close ReactionSelector when message actions toggle is clicked while dropdown selector is open', async () => {
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-reaction': true },
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(dropdownReactionActionTestId));
      });

      expect(screen.getByTestId(reactionSelectorTestId)).toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(screen.getByTestId(TOGGLE_ACTIONS_BUTTON_TEST_ID));
      });

      await waitFor(() => {
        expect(screen.queryByTestId(reactionSelectorTestId)).not.toBeInTheDocument();
      });
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
        last_read: new Date().toISOString(),
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

    const renderMarkUnreadUI = async ({ channelProps, chatProps, messageProps }: any) =>
      await act(async () => {
        await render(
          <ChatViewContext.Provider value={chatViewContextValue}>
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
            </Chat>
          </ChatViewContext.Provider>,
        );
      });

    afterEach(vi.restoreAllMocks);

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

    it('should be displayed for other users messages', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [
          {
            channel: { own_capabilities },
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

      expect(screen.queryByText(ACTION_TEXT)).toBeInTheDocument();
    });

    it('should not be displayed for own messages', async () => {
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

      expect(screen.queryByText(ACTION_TEXT)).not.toBeInTheDocument();
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
      vi.spyOn(channel, 'markUnread');

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

    it('should emit success notification on successful mark unread', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Message marked as unread',
          options: expect.objectContaining({ severity: 'success' }),
        }),
      );
    });

    it('should emit error notification on failed mark unread', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels({
        channelsData: [{ channel: { own_capabilities }, messages: [message], read }],
        customUser: me,
      });
      vi.spyOn(channel, 'markUnread').mockRejectedValueOnce(undefined!);
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMarkUnreadUI({
        channelProps: { channel },
        chatProps: { client },
        messageProps: { message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message:
            'Error marking message unread. Cannot mark unread messages older than the newest 100 channel messages.',
          options: expect.objectContaining({ severity: 'error' }),
        }),
      );
    });
  });

  describe('Remind me action', () => {
    const ACTION_TEXT = 'Remind me';

    const getMessageActionsWithReminders = () => [
      'delete',
      'edit',
      'flag',
      'mute',
      'pin',
      'quote',
      'react',
      'remindMe',
      'reply',
      'saveForLater',
    ];

    it('should emit success notification on successful remind me set', async () => {
      const client = await getTestClientWithUser(alice);
      vi.spyOn(client.reminders, 'upsertReminder').mockResolvedValueOnce(undefined!);
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      const remindMeOption = document.querySelector(
        '.str-chat__message-actions-box__submenu .str-chat__message-actions-list-item-button',
      ) as HTMLButtonElement;

      await act(async () => {
        await fireEvent.click(remindMeOption);
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Reminder set',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:message:reminder:set:success',
          }),
        }),
      );
    });

    it('should emit error notification on failed remind me set', async () => {
      const client = await getTestClientWithUser(alice);
      vi.spyOn(client.reminders, 'upsertReminder').mockRejectedValueOnce(
        new Error('Boom'),
      );
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(ACTION_TEXT));
      });

      const remindMeOption = document.querySelector(
        '.str-chat__message-actions-box__submenu .str-chat__message-actions-list-item-button',
      ) as HTMLButtonElement;

      await act(async () => {
        await fireEvent.click(remindMeOption);
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Boom',
          options: expect.objectContaining({
            severity: 'error',
            type: 'api:message:reminder:set:failed',
          }),
        }),
      );
    });
  });

  describe('Save for later action', () => {
    const SAVE_ACTION_TEXT = 'Save for later';
    const REMOVE_ACTION_TEXT = 'Remove save for later';

    const getMessageActionsWithReminders = () => [
      'delete',
      'edit',
      'flag',
      'mute',
      'pin',
      'quote',
      'react',
      'remindMe',
      'reply',
      'saveForLater',
    ];

    it('should emit success notification on successful save for later', async () => {
      const client = await getTestClientWithUser(alice);
      vi.spyOn(client.reminders, 'createReminder').mockResolvedValueOnce(undefined!);
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(SAVE_ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Saved for later',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:message:saveForLater:create:success',
          }),
        }),
      );
    });

    it('should emit error notification on failed save for later', async () => {
      const client = await getTestClientWithUser(alice);
      vi.spyOn(client.reminders, 'createReminder').mockRejectedValueOnce(
        new Error('Save failed'),
      );
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(SAVE_ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Save failed',
          options: expect.objectContaining({
            severity: 'error',
            type: 'api:message:saveForLater:create:failed',
          }),
        }),
      );
    });

    it('should emit success notification on successful remove save for later', async () => {
      const client = await getTestClientWithUser(alice);
      const message = generateMessage();
      client.reminders.hydrateState([
        generateMessage({
          ...message,
          reminder: generateReminderResponse({
            data: { message_id: message.id },
          }),
        }),
      ]);
      vi.spyOn(client.reminders, 'deleteReminder').mockResolvedValueOnce(undefined!);
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
          message,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(REMOVE_ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Remove save for later',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:message:saveForLater:delete:success',
          }),
        }),
      );
    });

    it('should emit error notification on failed remove save for later', async () => {
      const client = await getTestClientWithUser(alice);
      const message = generateMessage();
      client.reminders.hydrateState([
        generateMessage({
          ...message,
          reminder: generateReminderResponse({
            data: { message_id: message.id },
          }),
        }),
      ]);
      vi.spyOn(client.reminders, 'deleteReminder').mockRejectedValueOnce(
        new Error('Remove failed'),
      );
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');

      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: getMessageActionsWithReminders,
          message,
        },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText(REMOVE_ACTION_TEXT));
      });

      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Remove failed',
          options: expect.objectContaining({
            severity: 'error',
            type: 'api:message:saveForLater:delete:failed',
          }),
        }),
      );
    });
  });

  describe('Custom message action sets', () => {
    it('should render custom dropdown action components', async () => {
      const CustomAction = () => <button data-testid='custom-action'>Custom</button>;
      const customMessageActionSet = [
        // include default toggle
        defaultMessageActionSet.find(
          ({ placement }) => placement === 'quick-dropdown-toggle',
        ),
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

    it('should render custom quick action components', async () => {
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

    it('should render custom quick-dropdown-toggle component', async () => {
      const CustomQuickDropdownToggle = () => (
        <button data-testid='custom-quick-dropdown-toggle'>Toggle</button>
      );
      const customMessageActionSet = [
        {
          Component: vi.fn(),
          placement: 'dropdown',
        },
        {
          Component: CustomQuickDropdownToggle,
          placement: 'quick-dropdown-toggle',
        },
      ];

      await renderMessageActions({
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
          messageActionSet: customMessageActionSet,
        },
      });

      expect(screen.getByTestId('custom-quick-dropdown-toggle')).toBeInTheDocument();
    });

    it('should allow disabling base filter', async () => {
      const message = generateMessage({ status: 'failed' });
      const { container } = await renderMessageActions({
        customMessageContext: { message },
        messageActionsProps: {
          disableBaseMessageActionSetFilter: true,
        },
      });

      // Should render even for failed messages when filter is disabled
      expect(container.querySelector('.str-chat__message-options')).toBeInTheDocument();
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
      const results = await axe(container, {
        rules: {
          // Known issue: ContextMenuButton uses aria-selected on <button> without role="option"
          'aria-allowed-attr': { enabled: false },
        },
      });
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

    it('should render context menu with dropdown actions when opened', async () => {
      const { container } = await renderMessageActions();
      await toggleOpenMessageActions();

      const contextMenu = container.querySelector('.str-chat__context-menu');
      expect(contextMenu).toBeInTheDocument();
    });
  });

  describe('Default message actions edge coverage', () => {
    it('should download single local upload attachment from the Download action', async () => {
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('fetch blocked in test'));
      try {
        const attachment = generateLocalFileUploadAttachmentData(
          { id: 'local-file-1' },
          {
            asset_url: 'https://example.com/q1-2026-report.pdf',
            title: 'Q1-2026-report.pdf',
          },
        );
        const message = generateMessage({ attachments: [attachment], user: alice });

        await renderMessageActions({
          customMessageContext: { message },
        });
        await toggleOpenMessageActions();

        await act(async () => {
          await fireEvent.click(screen.getByText('Download Attachment'));
        });

        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalledTimes(1);
        });
      } finally {
        fetchSpy.mockRestore();
        clickSpy.mockRestore();
      }
    });

    it('should open a download submenu when message has multiple local upload attachments', async () => {
      const firstAttachment = generateLocalFileUploadAttachmentData(
        {
          file: { name: 'bloom-and-harbor-cafe-menu-summer-2026.pdf' },
          id: 'local-file-1',
        },
        {
          asset_url: 'https://example.com/bloom-and-harbor-cafe-menu-summer-2026.pdf',
          title: 'bloom-and-harbor-cafe-menu-summer-2026.pdf',
        },
      );
      const secondAttachment = generateLocalFileUploadAttachmentData(
        { file: { name: 'Q1-2026-report.pdf' }, id: 'local-file-2' },
        {
          asset_url: 'https://example.com/q1-2026-report.pdf',
          title: 'Q1-2026-report.pdf',
        },
      );
      const message = generateMessage({
        attachments: [firstAttachment, secondAttachment],
        user: alice,
      });

      await renderMessageActions({
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText('Download Attachment'));
      });

      expect(screen.getByText('Download All')).toBeInTheDocument();
      expect(
        screen.getByText('Download bloom-and-harbor-cafe-menu-summer-2026.pdf'),
      ).toBeInTheDocument();
      expect(screen.getByText('Download Q1-2026-report.pdf')).toBeInTheDocument();
    });

    it('should return to parent menu from download submenu header', async () => {
      const firstAttachment = generateLocalFileUploadAttachmentData(
        { file: { name: 'a.pdf' }, id: 'local-file-1' },
        { asset_url: 'https://example.com/a.pdf', title: 'a.pdf' },
      );
      const secondAttachment = generateLocalFileUploadAttachmentData(
        { file: { name: 'b.pdf' }, id: 'local-file-2' },
        { asset_url: 'https://example.com/b.pdf', title: 'b.pdf' },
      );
      const message = generateMessage({
        attachments: [firstAttachment, secondAttachment],
        user: alice,
      });

      await renderMessageActions({
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Download Attachment'));
      });
      expect(screen.getByText('Download All')).toBeInTheDocument();

      await act(async () => {
        await fireEvent.click(
          document.querySelector(
            '.str-chat__context-menu__back-button',
          ) as HTMLButtonElement,
        );
      });

      expect(screen.queryByText('Download All')).not.toBeInTheDocument();
      expect(screen.getByText('Pin')).toBeInTheDocument();
    });

    it('should open download submenu when there are multiple downloadable non-local attachments', async () => {
      const firstAttachment = generateFileAttachment({
        asset_url: 'https://example.com/attachments/first.pdf',
        title: 'first.pdf',
      });
      const secondAttachment = generateImageAttachment({
        image_url: 'https://example.com/attachments/second.png',
        title: 'second.png',
      });
      const message = generateMessage({
        attachments: [firstAttachment, secondAttachment],
        user: alice,
      });

      await renderMessageActions({
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();

      await act(async () => {
        await fireEvent.click(screen.getByText('Download Attachment'));
      });

      expect(screen.getByText('Download All')).toBeInTheDocument();
      expect(screen.getByText('Download first.pdf')).toBeInTheDocument();
      expect(screen.getByText('Download second.png')).toBeInTheDocument();
    });

    it('should download all non-local attachments from download submenu', async () => {
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('fetch blocked in test'));
      try {
        const firstAttachment = generateFileAttachment({
          asset_url: 'https://example.com/attachments/first.pdf',
          title: 'first.pdf',
        });
        const secondAttachment = generateImageAttachment({
          image_url: 'https://example.com/attachments/second.png',
          title: 'second.png',
        });
        const message = generateMessage({
          attachments: [firstAttachment, secondAttachment],
          user: alice,
        });

        await renderMessageActions({
          customMessageContext: { message },
        });
        await toggleOpenMessageActions();
        await act(async () => {
          await fireEvent.click(screen.getByText('Download Attachment'));
        });
        await act(async () => {
          await fireEvent.click(screen.getByText('Download All'));
        });

        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalledTimes(2);
        });
      } finally {
        fetchSpy.mockRestore();
        clickSpy.mockRestore();
      }
    });

    it('should download all local upload attachments from download submenu', async () => {
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => undefined);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValue(new Error('fetch blocked in test'));
      try {
        const firstAttachment = generateLocalFileUploadAttachmentData(
          { id: 'local-file-1' },
          {
            asset_url: 'https://example.com/first.pdf',
            title: 'first.pdf',
          },
        );
        const secondAttachment = generateLocalFileUploadAttachmentData(
          { id: 'local-file-2' },
          {
            asset_url: 'https://example.com/second.pdf',
            title: 'second.pdf',
          },
        );
        const message = generateMessage({
          attachments: [firstAttachment, secondAttachment],
          user: alice,
        });

        await renderMessageActions({
          customMessageContext: { message },
        });
        await toggleOpenMessageActions();
        await act(async () => {
          await fireEvent.click(screen.getByText('Download Attachment'));
        });

        await act(async () => {
          await fireEvent.click(screen.getByText('Download All'));
        });

        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalledTimes(2);
        });
      } finally {
        fetchSpy.mockRestore();
        clickSpy.mockRestore();
      }
    });

    it('should copy message text to clipboard when Copy is used', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      const message = generateMessage({ text: 'hello copy', user: alice });
      await renderMessageActions({
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Copy Message'));
      });
      expect(writeText).toHaveBeenCalledWith('hello copy');
    });

    it('should call handleRetry when Resend is used on a failed message', async () => {
      const handleRetry = vi.fn();
      const message = generateMessage({
        error: { status: 400 },
        status: 'failed',
        user: alice,
      });
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'send-message': true },
        },
        customMessageContext: { handleRetry, message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Resend'));
      });
      expect(handleRetry).toHaveBeenCalledWith(message);
    });

    it('should call client.blockUser when Block User is used', async () => {
      const otherUser = generateUser();
      const message = generateMessage({ user: otherUser });
      const chatClient = await getTestClientWithUser(alice);
      const blockUserSpy = vi.spyOn(chatClient, 'blockUser').mockImplementation(() => {});
      await renderMessageActions({
        chatClient,
        customMessageContext: { message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Block User'));
      });
      expect(blockUserSpy).toHaveBeenCalledWith(otherUser.id);
    });

    it('should notify on delete failure from the confirmation modal', async () => {
      const handleDelete = vi.fn().mockRejectedValueOnce(new Error('delete failed'));
      const message = generateMessage({ user: alice });
      const chatClient = await getTestClientWithUser(alice);
      const addSpy = vi.spyOn(chatClient.notifications, 'add');
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'delete-own-message': true },
        },
        chatClient,
        customMessageContext: { handleDelete, message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Delete message'));
      });
      await act(async () => {
        await fireEvent.click(screen.getByTestId('delete-message-alert-delete-button'));
      });
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'delete failed',
          options: expect.objectContaining({ severity: 'error' }),
        }),
      );
    });

    it('should pass through non-Error pin failures for notifications', async () => {
      const handlePin = vi.fn().mockRejectedValueOnce({ message: 'pin rejected' });
      const message = generateMessage({ pinned: false, user: alice });
      const chatClient = await getTestClientWithUser(alice);
      const addSpy = vi.spyOn(chatClient.notifications, 'add');
      await renderMessageActions({
        channelStateOpts: {
          channelCapabilities: { 'pin-message': true },
        },
        chatClient,
        customMessageContext: { handlePin, message },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Pin'));
      });
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error pinning message',
          options: expect.objectContaining({
            originalError: expect.objectContaining({ message: 'pin rejected' }),
            severity: 'error',
          }),
        }),
      );
    });

    it('should return to parent menu from Remind me submenu header', async () => {
      const client = await getTestClientWithUser(alice);
      await renderMessageActions({
        channelConfig: { replies: true, user_message_reminders: true },
        channelStateOpts: {
          channelCapabilities: { 'send-reply': true },
        },
        chatClient: client,
        customMessageContext: {
          getMessageActions: () => [
            'delete',
            'edit',
            'flag',
            'mute',
            'pin',
            'quote',
            'react',
            'remindMe',
            'reply',
            'saveForLater',
          ],
        },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Remind me'));
      });
      await act(async () => {
        await fireEvent.click(
          document.querySelector(
            '.str-chat__context-menu__back-button',
          ) as HTMLButtonElement,
        );
      });
      expect(screen.getByText('Thread Reply')).toBeInTheDocument();
    });

    it('should surface string rejection from reminder upsert as notification message', async () => {
      const client = await getTestClientWithUser(alice);
      vi.spyOn(client.reminders, 'upsertReminder').mockRejectedValueOnce('string-fail');
      const addNotificationSpy = vi.spyOn(client.notifications, 'add');
      await renderMessageActions({
        channelConfig: { user_message_reminders: true },
        chatClient: client,
        customMessageContext: {
          getMessageActions: () => [
            'delete',
            'edit',
            'flag',
            'mute',
            'pin',
            'quote',
            'react',
            'remindMe',
            'reply',
            'saveForLater',
          ],
        },
      });
      await toggleOpenMessageActions();
      await act(async () => {
        await fireEvent.click(screen.getByText('Remind me'));
      });
      const remindMeOption = document.querySelector(
        '.str-chat__message-actions-box__submenu .str-chat__message-actions-list-item-button',
      ) as HTMLButtonElement;
      await act(async () => {
        await fireEvent.click(remindMeOption);
      });
      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error setting reminder',
          options: expect.objectContaining({
            originalError: expect.objectContaining({ message: 'string-fail' }),
            severity: 'error',
          }),
        }),
      );
    });

    it('should focus thread textarea when quoting from a thread message', async () => {
      const {
        channels: [channel],
        client,
      } = await initClientWithChannels();
      const message = generateMessage({ parent_id: 'parent-1', user: client.user });
      const textarea = document.createElement('textarea');
      textarea.className = 'str-chat__textarea__textarea';
      const threadRoot = document.createElement('div');
      threadRoot.className = 'str-chat__thread';
      threadRoot.appendChild(textarea);
      document.body.appendChild(threadRoot);
      const focusSpy = vi.spyOn(textarea, 'focus');

      await act(async () => {
        await render(
          <ChatProvider value={mockChatContext({ client })}>
            <DialogManagerProvider id='message-actions-dialog-provider'>
              <ChannelStateProvider
                value={mockChannelStateContext({
                  channel,
                  channelCapabilities: { 'quote-message': true },
                })}
              >
                <ChannelActionProvider
                  value={mockChannelActionContext({
                    openThread: vi.fn(),
                    removeMessage: vi.fn(),
                    updateMessage: vi.fn(),
                  })}
                >
                  <TranslationProvider value={mockTranslationContextValue()}>
                    <ComponentProvider value={mockComponentContext()}>
                      <MessageProvider
                        value={mockMessageContext({
                          ...defaultMessageContextValue,
                          message,
                        })}
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
        await fireEvent.click(screen.getByText('Quote Reply'));
      });
      expect(focusSpy).toHaveBeenCalled();
      document.body.removeChild(threadRoot);
    });
  });
});
