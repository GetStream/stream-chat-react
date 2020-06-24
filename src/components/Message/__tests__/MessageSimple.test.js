import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  generateChannel,
  getTestClientWithUser,
  generateUser,
  generateMessage,
  generateReaction,
} from 'mock-builders';
import { MESSAGE_ACTIONS } from '../utils';
import { ChannelContext, TranslationContext } from '../../../context';
import MessageSimple from '../MessageSimple';
import { Modal as ModalMock } from '../../Modal';
import { Avatar as AvatarMock } from '../../Avatar';
import {
  MessageInput as MessageInputMock,
  EditMessageForm,
} from '../../MessageInput';
import { MessageActionsBox as MessageActionsBoxMock } from '../../MessageActions';

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div />),
}));

jest.mock('../../MessageActions', () => ({
  MessageActionsBox: jest.fn(() => <div />),
}));

jest.mock('../../MessageInput', () => ({
  MessageInput: jest.fn(() => <div />),
  EditMessageForm: jest.fn(() => <div />),
}));

jest.mock('../../Modal', () => ({
  Modal: jest.fn((props) => <div>{props.children}</div>),
}));

const alice = generateUser();
const bob = generateUser({ name: 'bob', image: 'bob-avatar.jpg' });
const carol = generateUser();
const openThreadMock = jest.fn();
const onMentionsClickMock = jest.fn();
const onMentionsHoverMock = jest.fn();
const tDateTimeParserMock = jest.fn(() => ({
  calendar: jest.fn(),
}));
const retrySendMessageMock = jest.fn();

async function renderMessageSimple(
  message,
  props = {},
  channelConfig = { replies: true },
) {
  const channel = generateChannel({ getConfig: () => channelConfig });
  const client = await getTestClientWithUser(alice);
  return render(
    <ChannelContext.Provider
      value={{
        client,
        channel,
        openThread: openThreadMock,
        onMentionsClick: onMentionsClickMock,
        onMentionsHover: onMentionsHoverMock,
        retrySendMessage: retrySendMessageMock,
      }}
    >
      <TranslationContext.Provider
        value={{ t: (key) => key, tDateTimeParser: tDateTimeParserMock }}
      >
        <MessageSimple
          message={message}
          typing={false}
          getMessageActions={() => Object.keys(MESSAGE_ACTIONS)}
          threadList={false}
          {...props}
        />
      </TranslationContext.Provider>
    </ChannelContext.Provider>,
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

const messageInputWrapperTestId = 'message-simple-inner-wrapper';
const reactionSelectorTestId = 'reaction-selector';
const simpleMessageReactionActionTestId = 'simple-message-reaction-action';
const threadActionTestId = 'thread-action';

describe('<MessageSimple />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmpty();
  });

  it('should not render anything if message is of type message.date', async () => {
    const message = generateAliceMessage({ type: 'message.date' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmpty();
  });

  it('should render deleted message with default MessageDelete component when message was deleted', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00'),
    });
    const { getByTestId } = await renderMessageSimple(deletedMessage);
    expect(getByTestId('message-deleted-component')).toBeInTheDocument();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-25T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid="custom-message-deleted">Gone!</p>
    );
    const { getByTestId } = await renderMessageSimple(deletedMessage, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
  });

  it('should render an edit form in a modal when in edit mode', async () => {
    const message = generateAliceMessage();
    const clearEditingState = jest.fn();
    const updateMessage = jest.fn();
    await renderMessageSimple(message, {
      editing: true,
      clearEditingState,
      updateMessage,
    });
    expect(ModalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        onClose: clearEditingState,
      }),
      {},
    );
    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clearEditingState,
        message,
        Input: EditMessageForm,
        updateMessage,
      }),
      {},
    );
  });

  it('should render no status when message not from the current user', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it('should not render status when message is an error message', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it('should render sending status when sending message', async () => {
    const message = generateAliceMessage({ status: 'sending' });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('message-status-sending')).toBeInTheDocument();
  });

  it('should render the "read by" status when the message is not part of a thread and was read by another chat members', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob],
    });
    expect(getByTestId('message-status-read-by')).toBeInTheDocument();
  });

  it('should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message, {
      readBy: [alice, bob, carol],
    });
    expect(getByTestId('message-status-read-by-many')).toBeInTheDocument();
  });

  it('should render a received status when the message has a received status and it is the same message as the last received one', async () => {
    const message = generateAliceMessage({ status: 'received' });
    const { getByTestId } = await renderMessageSimple(message, {
      lastReceivedId: message.id,
    });
    expect(getByTestId('message-status-received')).toBeInTheDocument();
  });

  it('should not render status when rendered in a thread list and was read by other members', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(message, {
      threadList: true,
      readBy: [alice, bob, carol],
    });
    expect(queryByTestId(/message-status/)).toBeNull();
  });

  it("should render the message user's avatar", async () => {
    const message = generateBobMessage();
    await renderMessageSimple(message, {
      onUserClick: jest.fn(),
      onUserHover: jest.fn(),
    });
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        image: message.user.image,
        name: message.user.name,
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
      },
      {},
    );
  });

  it('should allow message to be retried when it failed', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { getByTestId } = await renderMessageSimple(message);
    expect(retrySendMessageMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('message-inner'));
    expect(retrySendMessageMock).toHaveBeenCalledWith(message);
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'failed'],
    ['status', 'sending'],
  ])(
    'should not render message options when there is no message text and message is of %s %s.',
    async (key, value) => {
      const message = generateAliceMessage({ [key]: value, text: undefined });
      const { queryByTestId } = await renderMessageSimple(message);
      expect(queryByTestId(/message-actions/)).toBeNull();
    },
  );

  it('should not render message options when there is no message text and it is parent message in a thread', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { queryByTestId } = await renderMessageSimple(message, {
      initialMessage: true,
    });
    expect(queryByTestId(/message-actions/)).toBeNull();
  });

  it('should render closed message actions when message has no text but has at least one action', async () => {
    const message = generateAliceMessage();
    await renderMessageSimple(message);
    expect(MessageActionsBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open: false,
        mine: true,
        getMessageActions: expect.any(Function),
        handleEdit: expect.any(Function),
        handleFlag: expect.any(Function),
        handleMute: expect.any(Function),
        handleDelete: expect.any(Function),
      }),
      {},
    );
  });

  it('should open the actions box when it is clicked', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message);
    expect(MessageActionsBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({ open: false }),
      {},
    );
    fireEvent.click(getByTestId('message-actions'));
    expect(MessageActionsBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({ open: true }),
      {},
    );
  });

  it('should display thread actions when message is not displayed on a thread list and channel has replies configured', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId(threadActionTestId)).toBeInTheDocument();
  });

  it('should not display thread actions when message is in a thread list', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(message, {
      threadList: true,
    });
    expect(queryByTestId(threadActionTestId)).toBeNull();
  });

  it('should not display thread actions when channel does not have replies enabled', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(
      message,
      { threadList: false },
      { replies: false },
    );
    expect(queryByTestId(threadActionTestId)).toBeNull();
  });

  it('should trigger open thread handler when thread action is clicked', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(
      message,
      { threadList: false },
      { replies: true },
    );
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('thread-action'));
    expect(openThreadMock).toHaveBeenCalledWith(
      message,
      expect.any(Object), // The click event
    );
  });

  it('should display reactions action when channel has reactions enabled', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: true },
    );
    expect(getByTestId(simpleMessageReactionActionTestId)).toBeInTheDocument();
  });

  it('should not display reactions action when channel has reactions disabled', async () => {
    const message = generateAliceMessage();
    const { queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: false },
    );
    expect(queryByTestId(simpleMessageReactionActionTestId)).toBeNull();
  });

  it('should display detailed reactions when reactions action is clicked', async () => {
    const message = generateAliceMessage();
    const { getByTestId, queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: true },
    );
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId(simpleMessageReactionActionTestId));
    expect(queryByTestId(reactionSelectorTestId)).toBeInTheDocument();
  });

  it('should display non image attachments in Attachment component when message has attachments that are not images', async () => {
    const attachment = {
      type: 'file',
      asset_url: 'file.pdf',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { queryAllByTestId } = await renderMessageSimple(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should display image attachments in gallery when message has image attachments', async () => {
    const attachment = {
      type: 'image',
      image_url: 'image.jpg',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { queryAllByTestId } = await renderMessageSimple(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
  });

  it('should set attachments css class modifier when message has text and is focused', async () => {
    const attachment = {
      type: 'image',
      image_url: 'image.jpg',
    };
    const message = generateAliceMessage({
      attachments: [attachment, attachment, attachment],
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId(messageInputWrapperTestId).className).toContain(
      '--has-attachment',
    );
  });

  it('should set emoji css class when message has text that is only emojis', async () => {
    const message = generateAliceMessage({ text: '🤖🤖🤖🤖' });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId(messageInputWrapperTestId).className).toContain(
      '--is-emoji',
    );
  });

  it('should handle message mention mouse hover event', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { getByTestId } = await renderMessageSimple(message);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
    fireEvent.mouseOver(getByTestId(messageInputWrapperTestId));
    expect(onMentionsHoverMock).toHaveBeenCalledTimes(1);
  });

  it('should handle message mentions mouse click event', async () => {
    const message = generateAliceMessage({ mentioned_users: [bob] });
    const { getByTestId } = await renderMessageSimple(message);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageInputWrapperTestId));
    expect(onMentionsClickMock).toHaveBeenCalledTimes(1);
  });

  it('should inform that message was not sent when message is has type "error"', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { getByText } = await renderMessageSimple(message);
    expect(getByText('Error · Unsent')).toBeInTheDocument();
  });

  it('should inform that retry is possible when message has status "failed"', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { getByText } = await renderMessageSimple(message);
    expect(
      getByText('Message Failed · Click to try again'),
    ).toBeInTheDocument();
  });

  it('render message html when unsafe html property is enabled', async () => {
    const message = generateAliceMessage({
      html: '<span data-testid="custom-html" />',
    });
    const { getByTestId } = await renderMessageSimple(message, {
      unsafeHTML: true,
    });
    expect(getByTestId('custom-html')).toBeInTheDocument();
  });

  it('render message text', async () => {
    const text = 'Hello, world!';
    const message = generateAliceMessage({ text });
    const { getByText } = await renderMessageSimple(message);
    expect(getByText(text)).toBeInTheDocument();
  });

  it('should show reaction list if message has reactions and detailed reactions are not displayed', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('reaction-list')).toBeInTheDocument();
  });

  it('should show reaction selector when message has reaction and reaction list is clicked', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId, queryByTestId } = await renderMessageSimple(message);
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId('reaction-list'));
    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
  });

  it('should display reply count and handle replies count button click when not in thread list and reply count is not 0', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
  });

  it('should open thread when reply count button is clicked', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageSimple(message);
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThreadMock).toHaveBeenCalledWith(
      message,
      expect.any(Object), // The event object
    );
  });

  it("should display message's user name when message not from the current user", async () => {
    const message = generateBobMessage();
    const { getByText } = await renderMessageSimple(message);
    expect(getByText(bob.name)).toBeInTheDocument();
  });

  it("should display message's timestamp", async () => {
    const messageDate = new Date('2019-12-25T01:00:00');
    const parsedDateText = 'last christmas';
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    tDateTimeParserMock.mockImplementation(() => ({
      calendar: () => parsedDateText,
    }));
    const { getByText } = await renderMessageSimple(message);
    expect(tDateTimeParserMock).toHaveBeenCalledWith(messageDate);
    expect(getByText(parsedDateText)).toBeInTheDocument();
  });
});
