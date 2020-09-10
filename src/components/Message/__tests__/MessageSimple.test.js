import React from 'react';
import { act, cleanup, render, fireEvent } from '@testing-library/react';
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
import MessageOptionsMock from '../MessageOptions';
import MessageTextMock from '../MessageText';
import {
  MessageInput as MessageInputMock,
  EditMessageForm,
} from '../../MessageInput';

jest.mock('../MessageOptions', () => jest.fn(() => <div />));
jest.mock('../MessageText', () => jest.fn(() => <div />));

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div />),
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

const reactionSelectorTestId = 'reaction-selector';

describe('<MessageSimple />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render anything if message is of type message.date', async () => {
    const message = generateAliceMessage({ type: 'message.date' });
    const { container } = await renderMessageSimple(message);
    expect(container).toBeEmptyDOMElement();
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

  it('should render reaction selector with custom component when one is given', async () => {
    const message = generateBobMessage({ text: undefined });
    // Passing the ref prevents a react warning
    // eslint-disable-next-line no-unused-vars
    const CustomReactionSelector = ({ handleReaction }, ref) => (
      <ul data-testid="custom-reaction-selector">
        <li>
          <button onClick={(e) => handleReaction('smile-emoticon', e)}>
            :)
          </button>
        </li>
        <li>
          <button onClick={(e) => handleReaction('sad-emoticon', e)}>:(</button>
        </li>
      </ul>
    );
    const { getByTestId } = await renderMessageSimple(message, {
      ReactionSelector: React.forwardRef(CustomReactionSelector),
    });
    const { onReactionListClick } = MessageOptionsMock.mock.calls[0][0];
    act(() => onReactionListClick());
    expect(getByTestId('custom-reaction-selector')).toBeInTheDocument();
  });

  it('should render reaction list with custom component when one is given', async () => {
    const bobReaction = generateReaction({ user: bob, type: 'cool-reaction' });
    const message = generateAliceMessage({
      text: undefined,
      latest_reactions: [bobReaction],
    });
    const CustomReactionsList = ({ reactions }) => (
      <ul data-testid="custom-reaction-list">
        {reactions.map((reaction) => {
          if (reaction.type === 'cool-reaction') {
            return <li key={reaction.type + reaction.user_id}>:)</li>;
          }
          return <li key={reaction.type + reaction.user_id}>?</li>;
        })}
      </ul>
    );
    const { getByTestId } = await renderMessageSimple(
      message,
      {
        ReactionsList: CustomReactionsList,
      },
      { reactions: true },
    );
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
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

  it('should render message options', async () => {
    const message = generateAliceMessage({ text: undefined });
    await renderMessageSimple(message, {
      handleOpenThread: jest.fn(),
    });
    expect(MessageOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        threadList: false,
        messageWrapperRef: expect.any(Object),
        onReactionListClick: expect.any(Function),
        handleOpenThread: expect.any(Function),
      }),
      {},
    );
  });

  it('should render message text when message has text', async () => {
    const message = generateAliceMessage({ text: 'Hello' });
    const actionsEnabled = true;
    const messageListRect = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      toJSON: () => {},
    };
    const unsafeHTML = false;
    await renderMessageSimple(message, {
      actionsEnabled,
      messageListRect,
      unsafeHTML,
    });
    expect(MessageTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        actionsEnabled,
        messageListRect,
        unsafeHTML,
        reactionSelectorRef: expect.any(Object),
      }),
      {},
    );
  });

  it('should display detailed reactions when reactions action is clicked', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { queryByTestId } = await renderMessageSimple(
      message,
      {},
      { reactions: true },
    );
    const { onReactionListClick } = MessageOptionsMock.mock.calls[0][0];
    act(() => onReactionListClick());
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
