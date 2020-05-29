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

import Message from '../Message';
import MessageLivestream from '../MessageLivestream';
import { Avatar as AvatarMock } from '../../Avatar';
import { MessageInput as MessageInputMock } from '../../MessageInput';
import { MessageActionsBox as MessageActionsBoxMock } from '../../MessageActions';

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div />),
}));

jest.mock('../../MessageInput', () => ({
  MessageInput: jest.fn(() => <div />),
}));

jest.mock('../../MessageActions', () => ({
  MessageActionsBox: jest.fn(() => <div />),
}));

const alice = generateUser({ name: 'alice', image: 'alice-avatar.jpg' });
const bob = generateUser({ name: 'bob', image: 'bob-avatar.jpg' });

async function renderMessageLivestream(
  message,
  props = {},
  channelConfig = { replies: true },
) {
  const channel = generateChannel({ getConfig: () => channelConfig });
  const client = await getTestClientWithUser(alice);
  return render(
    <Message
      t={(key) => key}
      channel={channel}
      client={client}
      message={message}
      typing={false}
      Message={MessageLivestream}
      {...props}
    />,
  );
}

function generateAliceMessage(messageOptions) {
  return generateMessage({
    user: alice,
    ...messageOptions,
  });
}

const pdfAttachment = {
  type: 'file',
  asset_url: 'file.pdf',
};

const imageAttachment = {
  type: 'image',
  image_url: 'image.jpg',
};

const messageLivestreamWrapperTestId = 'message-livestream';
const messageLiveStreamReactionsTestId = 'message-livestream-reactions-action';
const reactionSelectorTestId = 'reaction-selector';
const messageLivestreamthreadTestId = 'message-livestream-thread-action';
const messageLivestreamTextTestId = 'message-livestream-text';
const messageLivestreamErrorTestId = 'message-livestream-error';
const messageLivestreamCommandErrorTestId = 'message-livestream-command-error';

describe('<MessageLivestream />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageLivestream(message);
    expect(container).toBeEmpty();
  });

  it('should not render anything if message is of type message.date', async () => {
    const message = generateAliceMessage({ type: 'message.date' });
    const { container } = await renderMessageLivestream(message);
    expect(container).toBeEmpty();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-17T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid="custom-message-deleted">Gone!</p>
    );
    const { getByTestId } = await renderMessageLivestream(deletedMessage, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
  });

  it('should render message input when in edit mode', async () => {
    const message = generateAliceMessage();
    const updateMessage = jest.fn();
    const clearEditingState = jest.fn();
    await renderMessageLivestream(message, {
      clearEditingState,
      editing: true,
      updateMessage,
    });
    expect(MessageInputMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        updateMessage,
        clearEditingState,
      }),
      {},
    );
  });

  it.each([
    ['should display', 'top', { shouldDisplay: true }],
    ['should display', 'single', { shouldDisplay: true }],
    ['should not display', 'middle', { shouldDisplay: false }],
    ['should not display', 'bottom', { shouldDisplay: false }],
  ])(
    '%s avatar component when rendered in edit mode and with first group style set to %s',
    async (_, groupStyle, { shouldDisplay }) => {
      const message = generateAliceMessage();
      const { getByTestId } = await renderMessageLivestream(message, {
        editing: true,
        groupStyles: [groupStyle],
      });
      expect(getByTestId('message-livestream-edit').className).toContain(
        `--${groupStyle}`,
      );
      if (shouldDisplay) {
        expect(AvatarMock).toHaveBeenCalledWith(
          {
            onClick: expect.any(Function),
            onMouseOver: expect.any(Function),
            size: 40,
            image: alice.image,
            name: alice.name,
          },
          {},
        );
      } else {
        expect(AvatarMock).not.toHaveBeenCalledWith();
      }
    },
  );

  it('should set group style as css class modifier', async () => {
    const message = generateAliceMessage();
    const groupStyle = 'set-group-style';
    const { getByTestId } = await renderMessageLivestream(message, {
      groupStyles: [groupStyle],
    });
    expect(getByTestId(messageLivestreamWrapperTestId).className).toContain(
      `--${groupStyle}`,
    );
  });

  it('should set message type as css class modifier', async () => {
    const messageType = 'message-type';
    const message = generateAliceMessage({ type: messageType });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId(messageLivestreamWrapperTestId).className).toContain(
      `--${messageType}`,
    );
  });

  it('should set message status as css class modifier', async () => {
    const messageStatus = 'message-status';
    const message = generateAliceMessage({ status: messageStatus });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId(messageLivestreamWrapperTestId).className).toContain(
      `--${messageStatus}`,
    );
  });

  it('should set initial message css class when message is the first one in a thread', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageLivestream(message, {
      initialMessage: true,
    });
    expect(getByTestId(messageLivestreamWrapperTestId).className).toContain(
      `--initial-message`,
    );
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'failed'],
    ['status', 'sending'],
  ])('should not render actions if message is of %s %s', async (key, value) => {
    const message = generateAliceMessage({ [key]: value, text: undefined });
    const { queryByTestId } = await renderMessageLivestream(message);
    expect(queryByTestId('message-livestream-actions')).toBeNull();
  });

  it('should display the formatted message creation date', async () => {
    const createdAt = new Date('2019-12-12T03:33:00');
    const message = generateAliceMessage({ created_at: createdAt });
    const format = jest.fn(() => createdAt.toDateString());
    const mockDateTimeParser = jest.fn(() => ({
      format,
    }));
    const { getByText } = await renderMessageLivestream(message, {
      tDateTimeParser: mockDateTimeParser,
    });
    expect(mockDateTimeParser).toHaveBeenCalledWith(createdAt);
    expect(format).toHaveBeenCalledWith('h:mmA');
    expect(getByText(createdAt.toDateString())).toBeInTheDocument();
  });

  it('should display a reactions icon when channel has reactions enabled', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageLivestream(
      message,
      {},
      {
        reactions: true,
      },
    );
    expect(getByTestId(messageLiveStreamReactionsTestId)).toBeInTheDocument();
  });

  it('should open reaction selector when reaction action is clicked', async () => {
    const message = generateAliceMessage();
    const { getByTestId, queryByTestId } = await renderMessageLivestream(
      message,
      {},
      { reactions: true },
    );
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId(messageLiveStreamReactionsTestId));
    expect(getByTestId(messageLiveStreamReactionsTestId)).toBeInTheDocument();
  });

  it('should close the reaction selector when mouse leaves the message wrapper', async () => {
    const message = generateAliceMessage();
    const { getByTestId, queryByTestId } = await renderMessageLivestream(
      message,
      {},
      { reactions: true },
    );
    fireEvent.click(getByTestId(messageLiveStreamReactionsTestId));
    expect(getByTestId(messageLiveStreamReactionsTestId)).toBeInTheDocument();
    fireEvent.mouseLeave(getByTestId(messageLivestreamWrapperTestId));
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
  });

  it('should display thread action button when channel has replies enabled', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageLivestream(
      message,
      {},
      { replies: true },
    );
    expect(getByTestId(messageLivestreamthreadTestId)).toBeInTheDocument();
  });

  it('should open thread when thread action button is clicked', async () => {
    const message = generateAliceMessage();
    const openThread = jest.fn();
    const { getByTestId } = await renderMessageLivestream(
      message,
      { openThread },
      { replies: true },
    );
    expect(openThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageLivestreamthreadTestId));
    expect(openThread).toHaveBeenCalledWith(
      message,
      expect.any(Object), // THe click event
    );
  });

  it('should render an action options icon when message has actions', async () => {
    const message = generateAliceMessage();
    const getMessageActions = () => ['edit, delete'];
    await renderMessageLivestream(message, {
      getMessageActions,
    });
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

  it('should render the user avatar', async () => {
    const message = generateAliceMessage();
    await renderMessageLivestream(message);
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        onClick: expect.any(Function),
        onMouseOver: expect.any(Function),
        size: 30,
        image: alice.image,
        name: alice.name,
      },
      {},
    );
  });

  it('should render the user name', async () => {
    const message = generateAliceMessage();
    const { getByText } = await renderMessageLivestream(message);
    expect(getByText(alice.name)).toBeInTheDocument();
  });

  it('should inform user about error visibility when message is of error type', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { getByText } = await renderMessageLivestream(message);
    expect(getByText('Only visible to you')).toBeInTheDocument();
  });

  it('should set emoji css class when message has text that is only emojis', async () => {
    const message = generateAliceMessage({ text: '🤖🤖🤖🤖' });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId(messageLivestreamTextTestId).className).toContain(
      '--is-emoji',
    );
  });

  it('should trigger mentions hover handler when user hovers message text', async () => {
    const message = generateAliceMessage();
    const onMentionsHover = jest.fn();
    const { getByTestId } = await renderMessageLivestream(message, {
      onMentionsHover,
    });
    expect(onMentionsHover).not.toHaveBeenCalled();
    fireEvent.mouseOver(getByTestId(messageLivestreamTextTestId));
    expect(onMentionsHover).toHaveBeenCalledTimes(1);
  });

  it('should trigger mentions click handler when user clicks message text', async () => {
    const message = generateAliceMessage();
    const onMentionsClick = jest.fn();
    const { getByTestId } = await renderMessageLivestream(message, {
      onMentionsClick,
    });
    expect(onMentionsClick).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageLivestreamTextTestId));
    expect(onMentionsClick).toHaveBeenCalledTimes(1);
  });

  it('should render the message text', async () => {
    const text = 'Hello world!';
    const message = generateAliceMessage({ text });
    const { getByText } = await renderMessageLivestream(message);
    expect(getByText(text)).toBeInTheDocument();
  });

  it('should render message html when unsafeHTML is enabled', async () => {
    const customTestId = 'custom-test-id';
    const message = generateAliceMessage({
      html: `<h1 data-testid="${customTestId}">Hello world</h1>`,
    });
    const { getByTestId } = await renderMessageLivestream(message, {
      unsafeHTML: true,
    });
    expect(getByTestId(customTestId)).toBeInTheDocument();
  });

  it('should display message error when message is of error type', async () => {
    const errorMessage = 'Unable to send it!';
    const message = generateAliceMessage({ type: 'error', text: errorMessage });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId(messageLivestreamErrorTestId)).toContainHTML(
      errorMessage,
    );
  });

  it('should display command message error when command message is of error type', async () => {
    const command = 'giphy';
    const message = generateAliceMessage({ type: 'error', command });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId(messageLivestreamCommandErrorTestId)).toContainHTML(
      `<strong>/${command}</strong> is not a valid command`,
    );
  });

  it('should inform user that message can be retried when it fails', async () => {
    const message = generateAliceMessage({ status: 'failed' });
    const { getByText } = await renderMessageLivestream(message);
    expect(
      getByText('Message failed. Click to try again.'),
    ).toBeInTheDocument();
  });

  it('should render non-image attachment components when message no text', async () => {
    const message = generateAliceMessage({
      attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
      text: undefined,
    });
    const { queryAllByTestId } = await renderMessageLivestream(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should render image attachments in gallery', async () => {
    const message = generateAliceMessage({
      attachments: [imageAttachment, imageAttachment, imageAttachment],
      text: undefined,
    });
    const { queryAllByTestId } = await renderMessageLivestream(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
  });

  it('should display the reaction list', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId } = await renderMessageLivestream(message);
    expect(getByTestId('simple-reaction-list')).toBeInTheDocument();
  });

  it('should display a message reply button when not on a thread and message has replies', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const { getByTestId } = await renderMessageLivestream(message, {
      initialMessage: false,
    });
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
  });

  it('should handle open thread when message has replies reply button is clicked', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const openThread = jest.fn();
    const { getByTestId } = await renderMessageLivestream(message, {
      initialMessage: false,
      openThread,
    });
    expect(openThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThread).toHaveBeenCalledTimes(1);
  });
});
