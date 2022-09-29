import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { toHaveNoViolations } from 'jest-axe';
import { axe } from '../../../../axe-helper';
expect.extend(toHaveNoViolations);

import { Message } from '../Message';
import { MessageSimple } from '../MessageSimple';
import { MessageOptions as MessageOptionsMock } from '../MessageOptions';
import { MessageText as MessageTextMock } from '../MessageText';
import { MESSAGE_ACTIONS } from '../utils';

import { Attachment as AttachmentMock } from '../../Attachment';
import { Avatar as AvatarMock } from '../../Avatar';
import { EditMessageForm, MessageInput as MessageInputMock } from '../../MessageInput';
import { MML as MMLMock } from '../../MML';
import { Modal as ModalMock } from '../../Modal';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import {
  emojiDataMock,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

Dayjs.extend(calendar);

jest.mock('../MessageOptions', () => ({ MessageOptions: jest.fn(() => <div />) }));
jest.mock('../MessageText', () => ({ MessageText: jest.fn(() => <div />) }));
jest.mock('../../MML', () => ({ MML: jest.fn(() => <div />) }));
jest.mock('../../Avatar', () => ({ Avatar: jest.fn(() => <div />) }));
jest.mock('../../MessageInput', () => ({
  EditMessageForm: jest.fn(() => <div />),
  MessageInput: jest.fn(() => <div />),
}));
jest.mock('../../Modal', () => ({ Modal: jest.fn((props) => <div>{props.children}</div>) }));

const alice = generateUser();
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });
const carol = generateUser();
const openThreadMock = jest.fn();
const tDateTimeParserMock = jest.fn((date) => Dayjs(date));
const retrySendMessageMock = jest.fn();

async function renderMessageSimple(
  message,
  props = {},
  channelConfigOverrides = { reactions: true, replies: true },
  components = {},
) {
  const channel = generateChannel({
    getConfig: () => channelConfigOverrides,
    state: { membership: {} },
  });
  const channelCapabilities = { 'send-reaction': true };
  const channelConfig = channel.getConfig();
  const client = await getTestClientWithUser(alice);

  return render(
    <ChatProvider value={{ client, themeVersion: '1' }}>
      <ChannelStateProvider
        value={{ channel, channelCapabilities, channelConfig, emojiConfig: emojiDataMock }}
      >
        <ChannelActionProvider
          value={{ openThread: openThreadMock, retrySendMessage: retrySendMessageMock }}
        >
          <TranslationProvider value={{ t: (key) => key, tDateTimeParser: tDateTimeParserMock }}>
            <ComponentProvider
              value={{
                Attachment: AttachmentMock,
                // eslint-disable-next-line react/display-name
                Message: () => <MessageSimple {...props} />,
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
            </ComponentProvider>
          </TranslationProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>,
  );
}

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
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of custom type message.date', async () => {
    const message = generateAliceMessage({ customType: 'message.date' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render deleted message with default MessageDelete component when message was deleted', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00'),
    });
    const { container, getByTestId } = await renderMessageSimple(deletedMessage);
    expect(getByTestId('message-deleted-component')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-25T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => <p data-testid='custom-message-deleted'>Gone!</p>;
    const { container, getByTestId } = await renderMessageSimple(deletedMessage, null, null, {
      MessageDeleted: CustomMessageDeletedComponent,
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
    const { container, getByTestId } = await renderMessageSimple(message, null, null, {
      MessageTimestamp: CustomMessageTimestamp,
    });
    expect(getByTestId('custom-message-timestamp')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom replies count button when one is given', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const CustomRepliesCount = () => <div data-testid='custom-message-replies-count'>Replies</div>;
    const { container, getByTestId } = await renderMessageSimple(message, null, null, {
      MessageRepliesCountButton: CustomRepliesCount,
    });
    expect(getByTestId('custom-message-replies-count')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message with custom options component when one is given', async () => {
    const message = generateAliceMessage({ text: '' });
    const CustomOptions = () => <div data-testid='custom-message-options'>Options</div>;
    const { container, getByTestId } = await renderMessageSimple(message, null, null, {
      MessageOptions: CustomOptions,
    });
    expect(getByTestId('custom-message-options')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render custom edit message input component when one is given', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();

    const CustomEditMessageInput = () => <div>Edit Input</div>;

    const { container } = await renderMessageSimple(
      message,
      { clearEditingState, editing: true },
      null,
      {
        EditMessageInput: CustomEditMessageInput,
      },
    );

    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clearEditingState,
        Input: CustomEditMessageInput,
        message,
      }),
      {},
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render reaction list if reaction is disabled in channel config', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });

    const { container, queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: false },
    );
    expect(queryByTestId('reaction-list')).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render reaction list with custom component when one is given', async () => {
    const bobReaction = generateReaction({ type: 'cool-reaction', user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
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
    const { container, getByTestId } = await renderMessageSimple(message, null, null, {
      ReactionsList: CustomReactionsList,
    });
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render an edit form in a modal when in edit mode', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();
    const { container } = await renderMessageSimple(message, {
      clearEditingState,
      editing: true,
    });
    expect(ModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onClose: clearEditingState,
        open: true,
      }),
      {},
    );
    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clearEditingState,
        Input: EditMessageForm,
        message,
      }),
      {},
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render no status when message not from the current user', async () => {
    const message = generateAliceMessage();
    const { container, queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render status when message is an error message', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { container, queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render sending status when sending message', async () => {
    const message = generateAliceMessage({ status: 'sending' });
    const { container, getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('message-status-sending')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the "read by" status when the message is not part of a thread and was read by another chat members', async () => {
    const message = generateAliceMessage();
    const { container, getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob],
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members', async () => {
    const message = generateAliceMessage();
    const { container, getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob, carol],
    });
    expect(getByTestId('message-status-read-by-many')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render a received status when the message has a received status and it is the same message as the last received one', async () => {
    const message = generateAliceMessage({ status: 'received' });
    const { container, getByTestId } = await renderMessageSimple(message, {
      lastReceivedId: message.id,
    });
    expect(getByTestId('message-status-received')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not render status when rendered in a thread list and was read by other members', async () => {
    const message = generateAliceMessage();
    const { container, queryByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob, carol],
      threadList: true,
    });
    expect(queryByTestId(/message-status/)).not.toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should render the message user's avatar", async () => {
    const message = generateBobMessage();
    const { container } = await renderMessageSimple(message, {
      onUserClick: jest.fn(),
      onUserHover: jest.fn(),
    });
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        image: message.user.image,
        name: message.user.name,
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
        user: expect.any(Object),
      },
      {},
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should allow message to be retried when it failed', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { container, getByTestId } = await renderMessageSimple(message, {
      handleRetry: retrySendMessageMock,
    });
    expect(retrySendMessageMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('message-inner'));
    expect(retrySendMessageMock).toHaveBeenCalledWith(message);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render message options', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { container } = await renderMessageSimple(message, {
      handleOpenThread: jest.fn(),
    });
    // eslint-disable-next-line jest/prefer-called-with
    expect(MessageOptionsMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render MML', async () => {
    const mml = '<mml>text</mml>';
    const message = generateAliceMessage({ mml });
    const { container } = await renderMessageSimple(message);
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'right', source: mml }),
      {},
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render MML on left for others', async () => {
    const mml = '<mml>text</mml>';
    const message = generateBobMessage({ mml });
    const { container } = await renderMessageSimple(message, { isMyMessage: () => false });
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'left', source: mml }),
      {},
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
    const { container } = await renderMessageSimple(message, {
      actionsEnabled,
      messageListRect,
      unsafeHTML,
    });
    // eslint-disable-next-line jest/prefer-called-with
    expect(MessageTextMock).toHaveBeenCalled();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display non image attachments in Attachment component when message has attachments that are not images', async () => {
    const attachment = {
      asset_url: 'file.pdf',
      type: 'file',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { container, queryAllByTestId } = await renderMessageSimple(message);
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
    const { container, queryAllByTestId } = await renderMessageSimple(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display reply count and handle replies count button click when not in thread list and reply count is not 0', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should open thread when reply count button is clicked', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { container, getByTestId } = await renderMessageSimple(message, {
      handleOpenThread: openThreadMock,
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
    const { container, getByText } = await renderMessageSimple(message, {
      isMyMessage: () => false,
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
    const { container, getByText } = await renderMessageSimple(message);
    expect(getByText('12/12/2019')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
