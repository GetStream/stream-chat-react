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
import MessageTeam from '../MessageTeam';
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
const carol = generateUser({ name: 'carol', image: 'carol-avatar.jpg' });

async function renderMessageTeam(
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
      Message={MessageTeam}
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

const messageTeamTestId = 'message-team';
const messageTeamThreadIcon = 'message-team-thread-icon';
const messageTeamReactionIcon = 'message-team-reaction-icon';
const reactionSelectorTestId = 'reaction-selector';
const messageTeamMessageTestId = 'message-team-message';

describe('<MessageTeam />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageTeam(message);
    expect(container).toBeEmpty();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-08-27T00:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid="custom-message-deleted">Gone!</p>
    );
    const { getByTestId } = await renderMessageTeam(deletedMessage, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
  });

  it('should render message input when in edit mode', async () => {
    const message = generateAliceMessage();
    const updateMessage = jest.fn();
    const clearEditingState = jest.fn();
    await renderMessageTeam(message, {
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
      const { getByTestId } = await renderMessageTeam(message, {
        editing: true,
        groupStyles: [groupStyle],
      });
      expect(getByTestId('message-team-edit').className).toContain(
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

  it('should display avatar if it is the first message on a thread', async () => {
    const message = generateAliceMessage();
    await renderMessageTeam(message, {
      initialMessage: true,
    });
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
  });

  it('should place a spacer when message is not the first message on a thread', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageTeam(message, {
      initialMessage: false,
    });
    expect(getByTestId('team-meta-spacer')).toBeInTheDocument();
  });

  it('should set group style as css class modifier', async () => {
    const message = generateAliceMessage();
    const groupStyle = 'set-group-style';
    const { getByTestId } = await renderMessageTeam(message, {
      groupStyles: [groupStyle],
    });
    expect(getByTestId(messageTeamTestId).className).toContain(
      `--${groupStyle}`,
    );
  });

  it('should display the time the message was created', async () => {
    const createdAt = new Date('2019-03-30T13:24:10');
    const message = generateAliceMessage({ created_at: createdAt });
    const dateFormatMock = jest.fn(() => 'formatted date');
    const mockDateTimeParser = jest.fn(() => ({
      format: dateFormatMock,
    }));
    await renderMessageTeam(message, { tDateTimeParser: mockDateTimeParser });
    expect(mockDateTimeParser).toHaveBeenCalledWith(createdAt);
    expect(dateFormatMock).toHaveBeenCalledWith('h:mmA');
  });

  it('should set message type as css class modifier', async () => {
    const messageType = 'message-type';
    const message = generateAliceMessage({ type: messageType });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId(messageTeamTestId).className).toContain(
      `--${messageType}`,
    );
  });

  it('should set message status as css class modifier', async () => {
    const messageStatus = 'message-status';
    const message = generateAliceMessage({ status: messageStatus });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId(messageTeamTestId).className).toContain(
      `--${messageStatus}`,
    );
  });

  it('should render the user name and handle a click on it when message is the first in a thread list', async () => {
    const message = generateAliceMessage();
    const onUserClick = jest.fn();
    const { getByTestId } = await renderMessageTeam(message, {
      initialMessage: true,
      onUserClick,
    });
    expect(getByTestId('message-team-author')).toBeInTheDocument();
    fireEvent.click(getByTestId('message-team-author'));
    expect(onUserClick).toHaveBeenCalledTimes(1);
  });

  it('should inform user about error visibility when message is of error type and the first in a thread list', async () => {
    const message = generateAliceMessage({ type: 'error' });
    const { getByText } = await renderMessageTeam(message, {
      initialMessage: true,
    });
    expect(getByText('Only visible to you')).toBeInTheDocument();
  });

  it('should set first group style modifier to message content wrapper', async () => {
    const message = generateAliceMessage();
    const groupStyle = 'top';
    const { getByTestId } = await renderMessageTeam(message, {
      groupStyles: [groupStyle],
    });
    expect(getByTestId('message-team-content').className).toContain(
      `--${groupStyle}`,
    );
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'failed'],
    ['status', 'sending'],
  ])('should not render actions if message is of %s %s', async (key, value) => {
    const message = generateAliceMessage({ [key]: value });
    const { queryByTestId } = await renderMessageTeam(message);
    expect(queryByTestId('message-team-actions')).toBeNull();
  });

  it('should display a reactions icon when channel has reactions enabled', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageTeam(
      message,
      {},
      {
        reactions: true,
      },
    );
    expect(getByTestId(messageTeamReactionIcon)).toBeInTheDocument();
  });

  it('should open reaction selector when reaction icon is clicked', async () => {
    const message = generateAliceMessage();
    const { getByTestId, queryByTestId } = await renderMessageTeam(
      message,
      {},
      { reactions: true },
    );
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId(messageTeamReactionIcon));
    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
  });

  it('should close the reaction selector when user clicks outside the selector', async () => {
    const message = generateAliceMessage();
    const { getByTestId, queryByTestId } = await renderMessageTeam(
      message,
      {},
      { reactions: true },
    );
    fireEvent.click(getByTestId(messageTeamReactionIcon));
    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
    fireEvent.click(document);
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
  });

  it('should display thread action button when channel has replies enabled', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageTeam(
      message,
      {},
      { replies: true },
    );
    expect(getByTestId(messageTeamThreadIcon)).toBeInTheDocument();
  });

  it('should open thread when thread action button is clicked', async () => {
    const message = generateAliceMessage();
    const openThread = jest.fn();
    const { getByTestId } = await renderMessageTeam(
      message,
      { openThread },
      { replies: true },
    );
    expect(openThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageTeamThreadIcon));
    expect(openThread).toHaveBeenCalledWith(
      message,
      expect.any(Object), // THe click event
    );
  });

  it('should render an action options icon when message has actions', async () => {
    const message = generateAliceMessage();
    const getMessageActions = () => ['edit, delete'];
    const isUserMuted = () => {};
    await renderMessageTeam(message, {
      getMessageActions,
      isUserMuted,
    });
    expect(MessageActionsBoxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        open: false,
        mine: true,
        isUserMuted: expect.any(Function),
        message,
        getMessageActions: expect.any(Function),
        handleEdit: expect.any(Function),
        handleFlag: expect.any(Function),
        handleMute: expect.any(Function),
        handleDelete: expect.any(Function),
      }),
      {},
    );
  });

  it('should set emoji css class when message has text that is only emojis', async () => {
    const message = generateAliceMessage({ text: '🤖🤖🤖🤖' });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId(messageTeamMessageTestId).className).toContain(
      '--is-emoji',
    );
  });

  it('should trigger mentions hover handler when user hovers message text', async () => {
    const message = generateAliceMessage();
    const onMentionsHover = jest.fn();
    const { getByTestId } = await renderMessageTeam(message, {
      onMentionsHover,
    });
    expect(onMentionsHover).not.toHaveBeenCalled();
    fireEvent.mouseOver(getByTestId(messageTeamMessageTestId));
    expect(onMentionsHover).toHaveBeenCalledTimes(1);
  });

  it('should trigger mentions click handler when user clicks message text', async () => {
    const message = generateAliceMessage();
    const onMentionsClick = jest.fn();
    const { getByTestId } = await renderMessageTeam(message, {
      onMentionsClick,
    });
    expect(onMentionsClick).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageTeamMessageTestId));
    expect(onMentionsClick).toHaveBeenCalledTimes(1);
  });

  it('should render message html when unsafeHTML is enabled', async () => {
    const customTestId = 'custom-test-id';
    const message = generateAliceMessage({
      html: `<h1 data-testid="${customTestId}">Hello world</h1>`,
    });
    const { getByTestId } = await renderMessageTeam(message, {
      unsafeHTML: true,
    });
    expect(getByTestId(customTestId)).toBeInTheDocument();
  });

  it('should render the message text', async () => {
    const text = 'Hello world!';
    const message = generateAliceMessage({ text });
    const { getByText } = await renderMessageTeam(message);
    expect(getByText(text)).toBeInTheDocument();
  });

  it('should render image attachments in gallery', async () => {
    const message = generateAliceMessage({
      attachments: [imageAttachment, imageAttachment, imageAttachment],
      text: undefined,
    });
    const { queryAllByTestId } = await renderMessageTeam(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
  });

  it('should render non-image attachment components when message has empty text', async () => {
    const message = generateAliceMessage({
      attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
      text: '',
    });
    const { queryAllByTestId } = await renderMessageTeam(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should display the reaction list when message has reactions and text is not empty', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: 'Welcome, bob!',
    });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId('simple-reaction-list')).toBeInTheDocument();
  });

  it('should allow message to be retried when it failed', async () => {
    const retrySendMessage = jest.fn();
    const message = generateAliceMessage({ status: 'failed' });
    const { getByTestId } = await renderMessageTeam(message, {
      retrySendMessage,
    });
    expect(retrySendMessage).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('message-team-failed'));
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });

  it('should display loading status when message is being sent', async () => {
    const message = generateAliceMessage({ status: 'sending' });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId('message-team-sending')).toBeInTheDocument();
  });

  it('should show users that read the message when it was read by another user that not the message owner', async () => {
    const message = generateAliceMessage();
    const { getByText } = await renderMessageTeam(message, {
      readBy: [alice, bob],
    });
    expect(getByText(bob.name)).toBeInTheDocument();
    expect(AvatarMock).toHaveBeenCalledWith(
      {
        name: bob.name,
        image: bob.image,
        size: 15,
      },
      {},
    );
  });

  it('should display the number of users that read the message if more than two users read it', async () => {
    const readBy = [alice, bob, carol];
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageTeam(message, { readBy });
    expect(getByTestId('message-team-read-by-count')).toHaveTextContent('2');
  });

  it('should display message delivered status when message is delivered', async () => {
    const messageId = 'd3ad47ce-74bf-4ef3-b6b3-b13340f9beda';
    const message = generateAliceMessage({ status: 'received', id: messageId });
    const { getByTestId } = await renderMessageTeam(message, {
      lastReceivedId: messageId,
    });
    expect(getByTestId('message-team-received')).toHaveTextContent('Delivered');
  });

  it('should render attachments when message has text', async () => {
    const message = generateAliceMessage({
      attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
      text: 'Hello, bob!',
    });
    const { queryAllByTestId } = await renderMessageTeam(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should display the reaction list when message has reactions and text is empty', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: '',
    });
    const { getByTestId } = await renderMessageTeam(message);
    expect(getByTestId('simple-reaction-list')).toBeInTheDocument();
  });

  it('should display a message reply button when not on a thread and message has replies', async () => {
    const message = generateAliceMessage({ reply_count: 1 });
    const { getByTestId } = await renderMessageTeam(message, {
      initialMessage: false,
    });
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
  });
});
