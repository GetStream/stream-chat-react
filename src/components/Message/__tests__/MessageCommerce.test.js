/* eslint-disable jest-dom/prefer-to-have-class */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmojiComponentMock from 'emoji-mart/dist-modern/components/emoji/nimble-emoji';

import { Message } from '../Message';
import { MessageCommerce } from '../MessageCommerce';

import { Attachment as AttachmentMock } from '../../Attachment';
import { Avatar as AvatarMock } from '../../Avatar';
import { MessageText as MessageTextMock } from '../MessageText';
import { MML as MMLMock } from '../../MML';

import { ChannelActionProvider } from '../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../context/ChannelStateContext';
import { ChatProvider } from '../../../context/ChatContext';
import { ComponentProvider } from '../../../context/ComponentContext';
import {
  emojiDataMock,
  generateChannel,
  generateMessage,
  generateReaction,
  generateUser,
  getTestClientWithUser,
} from '../../../mock-builders';

jest.mock('../../Avatar', () => ({ Avatar: jest.fn(() => <div />) }));
jest.mock('../../MML', () => ({ MML: jest.fn(() => <div />) }));
jest.mock('../MessageText', () => ({ MessageText: jest.fn(() => <div />) }));

const alice = generateUser({ image: 'alice-avatar.jpg', name: 'alice' });
const bob = generateUser({ image: 'bob-avatar.jpg', name: 'bob' });
const openThreadMock = jest.fn();

async function renderMessageCommerce(
  message,
  props = {},
  channelConfig = { replies: true },
  components = {},
) {
  const channel = generateChannel({ getConfig: () => channelConfig });
  const client = await getTestClientWithUser(alice);

  return render(
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel, emojiConfig: emojiDataMock }}>
        <ChannelActionProvider value={{ openThread: openThreadMock }}>
          <ComponentProvider
            value={{
              Attachment: AttachmentMock,
              Emoji: EmojiComponentMock,
              // eslint-disable-next-line react/display-name
              Message: () => <MessageCommerce {...props} />,
              ...components,
            }}
          >
            <Message
              getMessageActions={() => ['flag', 'mute', 'react', 'reply']}
              isMyMessage={() => true}
              message={message}
            />
          </ComponentProvider>
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

const pdfAttachment = {
  asset_url: 'file.pdf',
  type: 'file',
};

const imageAttachment = {
  image_url: 'image.jpg',
  type: 'image',
};

const messageCommerceWrapperTestId = 'message-commerce-wrapper';
const reactionListTestId = 'reaction-list';
const messageCommerceActionsTestId = 'message-reaction-action';

describe('<MessageCommerce />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of custom type message.date', async () => {
    const message = generateAliceMessage({ customType: 'message.date' });
    const { container } = await renderMessageCommerce(message);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-10T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => <p data-testid='custom-message-deleted'>Gone!</p>;
    const { getByTestId } = await renderMessageCommerce(deletedMessage, null, null, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
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
            return <li key={reaction.type + reaction.user_id}>:)</li>;
          }
          return <li key={reaction.type + reaction.user_id}>?</li>;
        })}
      </ul>
    );
    const { getByTestId } = await renderMessageCommerce(
      message,
      null,
      { reactions: true },
      { ReactionsList: CustomReactionsList },
    );
    expect(getByTestId('custom-reaction-list')).toBeInTheDocument();
  });

  it('should render custom avatar component when one is given', async () => {
    const message = generateAliceMessage();
    const CustomAvatar = () => <div data-testid='custom-avatar'>Avatar</div>;
    const { getByTestId } = await renderMessageCommerce(
      message,
      { groupStyles: ['bottom'] },
      null,
      { Avatar: CustomAvatar },
    );
    expect(getByTestId('custom-avatar')).toBeInTheDocument();
  });

  it('should position message to the right if it is from current user', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--right');
  });

  it('should position message to the left if it is not from current user', async () => {
    const message = generateBobMessage();
    const { getByTestId } = await renderMessageCommerce(message, {
      isMyMessage: () => false,
    });
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--left');
  });

  it('should set correct css class modifier if message has text', async () => {
    const message = generateAliceMessage({
      text: 'Some text will go on this message',
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--has-text');
  });

  it('should set correct css class modifier if message has not text', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--has-no-text');
  });

  it('should set correct css class modifier if message has attachments', async () => {
    const message = generateAliceMessage({ attachments: [pdfAttachment] });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--has-attachment');
  });

  it('should set correct css class modifier if message has reactions', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain('--with-reactions');
  });

  it('should not set css class modifier if reactions is disabled in channel config', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId } = await renderMessageCommerce(message, {}, { reactions: false });
    expect(getByTestId(messageCommerceWrapperTestId).className).not.toContain('--with-reactions');
  });

  it.each([['top'], ['bottom'], ['middle'], ['single']])(
    "should set correct css class modifier when message's first group style is %s",
    async (modifier) => {
      const message = generateAliceMessage();
      const { getByTestId } = await renderMessageCommerce(message, {
        groupStyles: [modifier],
      });
      expect(getByTestId(messageCommerceWrapperTestId).className).toContain(modifier);
    },
  );

  it.each([
    ['should display', 'bottom', { shouldDisplay: true }],
    ['should display', 'single', { shouldDisplay: true }],
    ['should not display', 'top', { shouldDisplay: false }],
    ['should not display', 'middle', { shouldDisplay: false }],
  ])('%s user avatar when group style is %s', async (_, groupStyle, { shouldDisplay }) => {
    const message = generateAliceMessage();
    await renderMessageCommerce(message, {
      groupStyles: [groupStyle],
    });
    if (shouldDisplay) {
      expect(AvatarMock).toHaveBeenCalledWith(
        {
          image: alice.image,
          name: alice.name,
          onClick: expect.any(Function),
          onMouseOver: expect.any(Function),
        },
        {},
      );
    } else {
      expect(AvatarMock).not.toHaveBeenCalled();
    }
  });

  it('should not show the reaction list if reactions disabled in channel config', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });
    const { queryByTestId } = await renderMessageCommerce(message, {}, { reactions: false });
    expect(queryByTestId(reactionListTestId)).not.toBeInTheDocument();
  });

  it('should show the reaction list when message has no text', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(reactionListTestId)).toBeInTheDocument();
  });

  it('should render message actions when message has no text and channel has reactions enabled', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { getByTestId } = await renderMessageCommerce(message, {}, { reactions: true });
    expect(getByTestId(messageCommerceActionsTestId)).toBeInTheDocument();
  });

  it('should not render message actions when message has no text and channel has reactions disabled', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { queryByTestId } = await renderMessageCommerce(message, {}, { reactions: false });
    expect(queryByTestId(messageCommerceActionsTestId)).not.toBeInTheDocument();
  });

  it('should render MML', async () => {
    const mml = '<mml>text</mml>';
    const message = generateAliceMessage({ mml });
    await renderMessageCommerce(message);
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'right', source: mml }),
      {},
    );
  });

  it('should render MML on left for others', async () => {
    const mml = '<mml>text</mml>';
    const message = generateBobMessage({ mml });
    await renderMessageCommerce(message, { isMyMessage: () => false });
    expect(MMLMock).toHaveBeenCalledWith(
      expect.objectContaining({ align: 'left', source: mml }),
      {},
    );
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'sending'],
    ['status', 'failed'],
  ])('should not render message actions when message has %s %s', async (key, value) => {
    const message = generateAliceMessage({ [key]: value, text: undefined });
    const { queryByTestId } = await renderMessageCommerce(message, {
      reactions: true,
    });
    expect(queryByTestId(messageCommerceActionsTestId)).not.toBeInTheDocument();
  });

  it('should render non-image attachment components when message no text', async () => {
    const message = generateAliceMessage({
      attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
      text: undefined,
    });
    const { queryAllByTestId } = await renderMessageCommerce(message);
    expect(queryAllByTestId('attachment-file')).toHaveLength(3);
  });

  it('should render image attachments in gallery when message has no text', async () => {
    const message = generateAliceMessage({
      attachments: [imageAttachment, imageAttachment, imageAttachment],
      text: undefined,
    });
    const { queryAllByTestId } = await renderMessageCommerce(message);
    expect(queryAllByTestId('gallery-image')).toHaveLength(3);
  });

  it('should render message text when message has text', async () => {
    const message = generateAliceMessage({ text: 'Hello' });
    await renderMessageCommerce(message);
    expect(MessageTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customWrapperClass: 'str-chat__message-commerce-text',
        theme: 'commerce',
      }),
      {},
    );
  });

  it('should display reply count when message is not on thread list', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId('replies-count-button')).toBeInTheDocument();
  });

  it('should open thread when message is not on a thread list and user click on the message replies count', async () => {
    const message = generateAliceMessage({
      reply_count: 1,
    });
    const { getByTestId } = await renderMessageCommerce(message, {
      handleOpenThread: openThreadMock,
    });
    expect(openThreadMock).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    // eslint-disable-next-line jest/prefer-called-with
    expect(openThreadMock).toHaveBeenCalled();
  });

  it('should display user name when message is not from current user', async () => {
    const message = generateBobMessage();
    const { getByText } = await renderMessageCommerce(message, {
      isMyMessage: () => false,
    });
    expect(getByText(bob.name)).toBeInTheDocument();
  });

  it("should display message's timestamp with time only format", async () => {
    const messageDate = new Date('2019-12-12T03:33:00');
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    const { getByText } = await renderMessageCommerce(message);
    expect(getByText('3:33 AM')).toBeInTheDocument();
  });
});
