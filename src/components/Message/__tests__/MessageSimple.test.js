import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
import { Message } from '../Message';
import { MessageSimple } from '../MessageSimple';
import { MessageOptions as MessageOptionsMock } from '../MessageOptions';
import { MessageText as MessageTextMock } from '../MessageText';
import { MESSAGE_ACTIONS } from '../utils';

import { Chat } from '../../Chat';
import { Attachment as AttachmentMock } from '../../Attachment';
import { Avatar as AvatarMock } from '../../Avatar';
import { getReadStates } from '../../MessageList';
import { MML as MMLMock } from '../../MML';
import { defaultReactionOptions } from '../../Reactions';

import {
  ChannelActionProvider,
  ChannelStateProvider,
  WithComponents,
} from '../../../context';
import {
  countReactions,
  generateChannel,
  generateFileAttachment,
  generateMessage,
  generateReaction,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  groupReactions,
  useMockedApis,
} from '../../../mock-builders';
import { MessageBouncePrompt } from '../../MessageBounce';
import { generateReminderResponse } from '../../../mock-builders/generator/reminder';

expect.extend(toHaveNoViolations);

Dayjs.extend(calendar);

jest.mock('../MessageOptions', () => ({
  MessageOptions: jest.fn(() => <div data-testid='mocked-message-options' />),
}));
jest.mock('../MessageText', () => ({
  MessageText: jest.fn(() => <div data-testid='mocked-message-text' />),
}));
jest.mock('../../MML', () => ({ MML: jest.fn(() => <div data-testid='mocked-mml' />) }));
jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div data-testid='mocked-avatar' />),
}));
jest.mock('../../Modal', () => ({
  Modal: jest.fn((props) => <div data-testid='mocked-modal'>{props.children}</div>),
}));

const alice = generateUser();
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });
const carol = generateUser();
const openThreadMock = jest.fn();
const retrySendMessageMock = jest.fn();
const removeMessageMock = jest.fn();

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

function generateBobMessage(messageOptions) {
  return generateMessage({
    user: bob,
    ...messageOptions,
  });
}

describe('<MessageSimple />', () => {
  let channel;
  let client;

  async function renderMessageSimple({
    channelCapabilities = { 'send-reaction': true },
    channelConfigOverrides = { replies: true },
    components = {},
    message,
    props = {},
    renderer = render,
  }) {
    let result;
    await act(() => {
      result = renderer(
        <Chat client={client}>
          <ChannelStateProvider
            value={{
              channel,
              channelCapabilities,
              channelConfig: channelConfigOverrides,
            }}
          >
            <ChannelActionProvider
              value={{
                openThread: openThreadMock,
                removeMessage: removeMessageMock,
                retrySendMessage: retrySendMessageMock,
              }}
            >
              <WithComponents
                overrides={{
                  Attachment: AttachmentMock,
                  Message: () => <MessageSimple {...props} />,
                  reactionOptions: defaultReactionOptions,
                  ...components,
                }}
              >
                <Message
                  getMessageActions={() => Object.keys(MESSAGE_ACTIONS)}
                  isMyMessage={() => true}
                  message={message}
                  threadList={false}
                  {...props}
                />
              </WithComponents>
            </ChannelActionProvider>
          </ChannelStateProvider>
        </Chat>,
      );
    });
    return result;
  }

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const mockedChannel = generateChannel({
      state: { membership: {} },
    });

    client = await getTestClientWithUser(alice);
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    channel = client.channel('messaging', mockedChannel.channel.id);
  });

  it('should not render anything if message is of custom type message.date', async () => {
    const message = generateAliceMessage({
      customType: 'message.date',
      date: new Date(),
    });
    const { container } = await renderMessageSimple({ message });
    expect(container).toBeEmptyDOMElement();
  });

  it('should render deleted message with default MessageDelete component when message was deleted', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00'),
    });
    const { container, getByTestId } = await renderMessageSimple({
      message: deletedMessage,
    });
    expect(getByTestId('message-deleted-component')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-25T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid='custom-message-deleted'>Gone!</p>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageDeleted: CustomMessageDeletedComponent,
      },
      message: deletedMessage,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom timestamp component when one is given', async () => {
    const message = generateAliceMessage();
    const CustomMessageTimestamp = () => (
      <div data-testid='custom-message-timestamp'>Timestamp</div>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageTimestamp: CustomMessageTimestamp,
      },
      message,
    });
    expect(getByTestId('custom-message-timestamp')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom replies count button when one is given', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const CustomRepliesCount = () => (
      <div data-testid='custom-message-replies-count'>Replies</div>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageRepliesCountButton: CustomRepliesCount,
      },
      message,
    });
    expect(getByTestId('custom-message-replies-count')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom options component when one is given', async () => {
    const message = generateAliceMessage({ text: '' });
    const CustomOptions = () => <div data-testid='custom-message-options'>Options</div>;
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        MessageOptions: CustomOptions,
      },
      message,
    });
    expect(getByTestId('custom-message-options')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom edit message input component when one is given', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();

    const CustomEditMessageInput = () => <div data-testid='custom-edit-message-input' />;

    const { container } = await renderMessageSimple({
      components: {
        EditMessageInput: CustomEditMessageInput,
      },
      message,
      props: { clearEditingState, editing: true },
    });

    expect(await screen.findByTestId('custom-edit-message-input')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom ReminderNotification component when one is given', async () => {
    const message = generateAliceMessage({ reminder: generateReminderResponse() });
    client.reminders.hydrateState([message]);
    const testId = 'custom-reminder-notification';
    const CustomReminderNotification = () => <div data-testid={testId} />;

    const { container } = await renderMessageSimple({
      channelConfigOverrides: {
        user_message_reminder: true,
      },
      components: {
        ReminderNotification: CustomReminderNotification,
      },
      message,
    });

    expect(await screen.findByTestId(testId)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // FIXME: test relying on deprecated channel config parameter
  it('should render reaction list even though sending reactions is disabled in channel config', async () => {
    const reactions = [generateReaction({ user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
      text: undefined,
    });

    const { container, queryByTestId } = await renderMessageSimple({
      channelCapabilities: { 'send-reaction': false },
      message,
    });
    expect(queryByTestId('reaction-list')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render reaction list with custom component when one is given', async () => {
    const reactions = [generateReaction({ type: 'cool-reaction', user: bob })];
    const message = generateAliceMessage({
      latest_reactions: reactions,
      reaction_counts: countReactions(reactions),
      reaction_groups: groupReactions(reactions),
      text: undefined,
    });
    const CustomReactionsList = ({ reactions = [] }) => (
      <ul data-testid='custom-reaction-list'>
        {reactions.map((reaction) => {
          if (reaction.type === 'cool-reaction') {
            return <li key={reaction.type + reaction.user_id}>`:)`</li>;
          }
          return <li key={reaction.type + reaction.user_id}>?</li>;
        })}
      </ul>
    );
    const { container, getByTestId } = await renderMessageSimple({
      components: {
        ReactionsList: CustomReactionsList,
      },
      message,
    });
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an edit form in a modal when in edit mode', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();
    const { container } = await renderMessageSimple({
      message,
      props: {
        clearEditingState,
        editing: true,
      },
    });

    expect(await screen.findByTestId('mocked-modal')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render no status when message not from the current user', async () => {
    const message = generateAliceMessage();
    const { container, queryByTestId } = await renderMessageSimple({ message });
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render status when message is an error message', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { container, queryByTestId } = await renderMessageSimple({ message });
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render sending status when sending message', async () => {
    const message = generateAliceMessage({ status: 'sending' });
    const { container, getByTestId } = await renderMessageSimple({ message });
    expect(getByTestId('message-status-sending')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the "read by" status when the message is not part of a thread and was read by another chat members', async () => {
    const message = generateAliceMessage();
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        readBy: [alice, bob],
      },
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should keep rendering the "received" status for already read message that was updated', async () => {
    const message = generateAliceMessage({
      created_at: new Date('1970-1-2'),
      status: 'received',
    });
    const returnAllReadData = false;
    const read = {
      [bob.id]: {
        last_read: new Date('1970-1-1'),
        last_read_message_id: message.id,
        unread_messages: 1,
        user: bob,
      },
    };
    let ownMessagesReadByOthers = getReadStates([message], read, returnAllReadData);
    const { container, getByTestId, rerender } = await renderMessageSimple({
      message,
      props: {
        lastReceivedId: message.id,
        readBy: ownMessagesReadByOthers[message.id],
      },
    });
    expect(getByTestId('message-status-received')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    const updatedMessage = { ...message, updated_at: new Date() };
    ownMessagesReadByOthers = getReadStates([updatedMessage], read, returnAllReadData);
    await renderMessageSimple({
      message: updatedMessage,
      props: {
        lastReceivedId: message.id,
        readBy: ownMessagesReadByOthers[message.id],
      },
      renderer: rerender,
    });

    expect(getByTestId('message-status-received')).toBeInTheDocument();
  });

  it('should keep rendering the "read by" status for already read message that was updated', async () => {
    const message = generateAliceMessage({
      created_at: new Date('1970-2-1'),
      status: 'received',
    });
    const returnAllReadData = false;
    const read = {
      [bob.id]: {
        last_read: new Date('1970-2-2'),
        last_read_message_id: message.id,
        unread_messages: 1,
        user: bob,
      },
    };
    let ownMessagesReadByOthers = getReadStates([message], read, returnAllReadData);
    const { container, getByTestId, rerender } = await renderMessageSimple({
      message,
      props: {
        lastReceivedId: message.id,
        readBy: ownMessagesReadByOthers[message.id],
      },
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    const updatedMessage = { ...message, updated_at: new Date() };
    ownMessagesReadByOthers = getReadStates([updatedMessage], read, returnAllReadData);
    await renderMessageSimple({
      message: updatedMessage,
      props: {
        lastReceivedId: message.id,
        readBy: ownMessagesReadByOthers[message.id],
      },
      renderer: rerender,
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
  });

  it('should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members', async () => {
    const message = generateAliceMessage();
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        readBy: [alice, bob, carol],
      },
    });
    expect(getByTestId('message-status-read-by-many')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render a received status when the message has a received status and it is the same message as the last received one', async () => {
    const message = generateAliceMessage({ status: 'received' });
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        lastReceivedId: message.id,
      },
    });
    expect(getByTestId('message-status-received')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render status when rendered in a thread list and was read by other members', async () => {
    const message = generateAliceMessage();
    const { container, queryByTestId } = await renderMessageSimple({
      message,
      props: {
        readBy: [alice, bob, carol],
        threadList: true,
      },
    });
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should render the message user's avatar", async () => {
    const message = generateBobMessage();
    const { container } = await renderMessageSimple({
      message,
      props: {
        onUserClick: jest.fn(),
        onUserHover: jest.fn(),
      },
    });
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        image: message.user.image,
        name: message.user.name,
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
        user: expect.any(Object),
      },
      undefined,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should allow message to be retried when it failed', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        handleRetry: retrySendMessageMock,
      },
    });
    expect(retrySendMessageMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('message-inner'));
    expect(retrySendMessageMock).toHaveBeenCalledWith(message);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message options', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { container } = await renderMessageSimple({
      message,
      props: {
        handleOpenThread: jest.fn(),
      },
    });

    expect(MessageOptionsMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render MML', async () => {
    const mml = '<mml>text</mml>';
    const message = generateAliceMessage({ mml });
    const { container } = await renderMessageSimple({ message });
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'right', source: mml }),
      undefined,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render MML on left for others', async () => {
    const mml = '<mml>text</mml>';
    const message = generateBobMessage({ mml });
    const { container } = await renderMessageSimple({
      message,
      props: { isMyMessage: () => false },
    });
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'left', source: mml }),
      undefined,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message text when message has text', async () => {
    const message = generateAliceMessage({ text: 'Hello' });
    const actionsEnabled = true;
    const messageListRect = {
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      toJSON: () => {},
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    };
    const unsafeHTML = false;
    const { container } = await renderMessageSimple({
      message,
      props: {
        actionsEnabled,
        messageListRect,
        unsafeHTML,
      },
    });

    expect(MessageTextMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display non image attachments in Attachment component when message has attachments that are not images', async () => {
    const message = generateAliceMessage({
      attachments: Array.from({ length: 3 }, generateFileAttachment),
    });
    const { container, queryAllByTestId } = await renderMessageSimple({ message });
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display image attachments in gallery when message has image attachments', async () => {
    const attachment = {
      image_url: 'http://image.jpg',
      type: 'image',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { container, queryAllByTestId } = await renderMessageSimple({ message });
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display reply count and handle replies count button click when not in thread list and reply count is not 0', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple({ message });
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should open thread when reply count button is clicked', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple({
      message,
      props: {
        handleOpenThread: openThreadMock,
      },
    });
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThreadMock).toHaveBeenCalledWith(
      expect.any(Object), // The event object
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should display message's user name when message not from the current user", async () => {
    const message = generateBobMessage();
    const { container, getByText } = await renderMessageSimple({
      message,
      props: {
        isMyMessage: () => false,
      },
    });
    expect(getByText(bob.name)).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should display message's timestamp with calendar formatting", async () => {
    const messageDate = new Date('2019-12-12T03:33:00');
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    const { container, getByText } = await renderMessageSimple({ message });
    expect(getByText('12/12/2019')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe.each([
    [
      'v1',
      {
        moderation_details: {
          action: 'MESSAGE_RESPONSE_ACTION_BOUNCE',
        },
        type: 'error',
      },
    ],
    [
      'v2',
      {
        moderation: {
          action: 'bounce',
        },
        type: 'error',
      },
    ],
  ])('bounced message %s', (_, bouncedMessageOptions) => {
    it('should render error badge for bounced messages', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { queryByTestId } = await renderMessageSimple({ message });
      expect(queryByTestId('error')).toBeInTheDocument();
    });

    it('should render open bounce modal on click', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({ message });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('message-bounce-prompt')).toBeInTheDocument();
    });

    it('should switch to message editing', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId, queryByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      fireEvent.click(getByTestId('message-bounce-edit'));
      expect(queryByTestId('message-input')).toBeInTheDocument();
    });

    it('should retry sending message', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      fireEvent.click(getByTestId('message-bounce-send'));
      expect(retrySendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: message.id,
        }),
      );
    });

    it('should remove message', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const { getByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      fireEvent.click(getByTestId('message-bounce-delete'));
      expect(removeMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: message.id,
        }),
      );
    });

    it('should use overriden modal content component', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const CustomMessageBouncePrompt = () => (
        <div data-testid='custom-message-bounce-prompt'>Overriden</div>
      );
      const { getByTestId, queryByTestId } = await renderMessageSimple({
        components: {
          MessageBouncePrompt: CustomMessageBouncePrompt,
        },
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('custom-message-bounce-prompt')).toBeInTheDocument();
    });

    it('should use overriden modal content text', async () => {
      const message = generateAliceMessage({
        ...bouncedMessageOptions,
        cid: channel.cid,
      });
      const CustomMessageBouncePrompt = () => (
        <MessageBouncePrompt>Overriden</MessageBouncePrompt>
      );
      const { getByTestId, queryByText } = await renderMessageSimple({
        components: {
          MessageBouncePrompt: CustomMessageBouncePrompt,
        },
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByText('Overriden')).toBeInTheDocument();
    });
  });

  describe('edited label', () => {
    const editedMessageOptions = {
      message_text_updated_at: '2024-03-05T09:56:22.487729Z',
    };

    it('should render error badge for bounced messages', async () => {
      const message = generateAliceMessage(editedMessageOptions);
      const { queryAllByText } = await renderMessageSimple({ message });
      expect(queryAllByText('Edited', { exact: true })).not.toHaveLength(0);
    });

    it('should render open bounce modal on click', async () => {
      const message = generateAliceMessage(editedMessageOptions);
      const { getByTestId, queryByTestId } = await renderMessageSimple({
        message,
      });
      fireEvent.click(getByTestId('message-inner'));
      expect(queryByTestId('message-edited-timestamp')).toBeInTheDocument();
      expect(queryByTestId('message-edited-timestamp')).toHaveClass(
        'str-chat__message-edited-timestamp--open',
      );
    });
  });
});
