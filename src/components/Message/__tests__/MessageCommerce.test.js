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
import MessageCommerce from '../MessageCommerce';
import { Avatar as AvatarMock } from '../../Avatar';

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(() => <div />),
}));

const alice = generateUser({ name: 'alice', image: 'alice-avatar.jpg' });
const bob = generateUser({ name: 'bob', image: 'bob-avatar.jpg' });

async function renderMessageCommerce(
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
      Message={MessageCommerce}
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

function generateBobMessage(messageOptions) {
  return generateMessage({
    user: bob,
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

const messageCommerceWrapperTestId = 'message-commerce-wrapper';
const reactionSelectorTestId = 'reaction-selector';
const reactionListTestId = 'reaction-list';
const messageCommerceActionsTestId = 'message-commerce-actions';

const messageCommerceInnerWrapperTestId = 'message-commerce-text-inner-wrapper';
describe('<MessageCommerce />', () => {
  afterEach(cleanup);
  beforeEach(jest.clearAllMocks);

  it('should not render anything if message is of type message.read', async () => {
    const message = generateAliceMessage({ type: 'message.read' });
    const { container } = await renderMessageCommerce(message);
    expect(container).toBeEmpty();
  });

  it('should not render anything if message is of type message.date', async () => {
    const message = generateAliceMessage({ type: 'message.date' });
    const { container } = await renderMessageCommerce(message);
    expect(container).toBeEmpty();
  });

  it('should render deleted message with custom component when message was deleted and a custom delete message component was passed', async () => {
    const deletedMessage = generateAliceMessage({
      deleted_at: new Date('2019-12-10T03:24:00'),
    });
    const CustomMessageDeletedComponent = () => (
      <p data-testid="custom-message-deleted">Gone!</p>
    );
    const { getByTestId } = await renderMessageCommerce(deletedMessage, {
      MessageDeleted: CustomMessageDeletedComponent,
    });
    expect(getByTestId('custom-message-deleted')).toBeInTheDocument();
  });

  it('should position message to the right if it is from current user', async () => {
    const message = generateAliceMessage();
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--right',
    );
  });

  it('should position message to the right if it is not from current user', async () => {
    const message = generateBobMessage();
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--left',
    );
  });

  it('should set correct css class modifier if message has text', async () => {
    const message = generateAliceMessage({
      text: 'Some text will go on this message',
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--has-text',
    );
  });

  it('should set correct css class modifier if message has not text', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--has-no-text',
    );
  });

  it('should set correct css class modifier if message has attachments', async () => {
    const message = generateAliceMessage({ attachments: [pdfAttachment] });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--has-attachment',
    );
  });

  it('should set correct css class modifier if message has reactions', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
      '--with-reactions',
    );
  });

  it.each([['top'], ['bottom'], ['middle'], ['single']])(
    "should set correct css class modifier when message's first group style is %s",
    async (modifier) => {
      const message = generateAliceMessage();
      const { getByTestId } = await renderMessageCommerce(message, {
        groupStyles: [modifier],
      });
      expect(getByTestId(messageCommerceWrapperTestId).className).toContain(
        modifier,
      );
    },
  );

  it.each([
    ['should display', 'bottom', { shouldDisplay: true }],
    ['should display', 'single', { shouldDisplay: true }],
    ['should not display', 'top', { shouldDisplay: false }],
    ['should not display', 'middle', { shouldDisplay: false }],
  ])(
    '%s user avatar when group style is %s',
    async (_, groupStyle, { shouldDisplay }) => {
      const message = generateAliceMessage();
      await renderMessageCommerce(message, {
        groupStyles: [groupStyle],
      });
      if (shouldDisplay) {
        expect(AvatarMock).toHaveBeenCalledWith(
          {
            image: alice.image,
            size: 32,
            name: alice.name,
            onClick: expect.any(Function),
            onMouseOver: expect.any(Function),
          },
          {},
        );
      } else {
        expect(AvatarMock).not.toHaveBeenCalled();
      }
    },
  );

  it('should show the reaction list when message has no text', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(reactionListTestId)).toBeInTheDocument();
  });

  it('should show the reaction selector when message has no text and user clicks on the reaction list', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: undefined,
    });
    const { getByTestId, queryByTestId } = await renderMessageCommerce(message);
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId(reactionListTestId));
    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
  });

  it('should render message actions when message has no text and channel has reactions enabled', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { getByTestId } = await renderMessageCommerce(
      message,
      {},
      { reactions: true },
    );
    expect(getByTestId(messageCommerceActionsTestId)).toBeInTheDocument();
  });

  it('should render message actions when message has no text and channel has reactions disabled', async () => {
    const message = generateAliceMessage({ text: undefined });
    const { queryByTestId } = await renderMessageCommerce(
      message,
      {},
      { reactions: false },
    );
    expect(queryByTestId(messageCommerceActionsTestId)).toBeNull();
  });

  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'sending'],
    ['status', 'failed'],
  ])(
    'should not render message actions when message has %s %s',
    async (key, value) => {
      const message = generateAliceMessage({ [key]: value, text: undefined });
      const { queryByTestId } = await renderMessageCommerce(message, {
        reactions: true,
      });
      expect(queryByTestId(messageCommerceActionsTestId)).toBeNull();
    },
  );

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

  it('should set attachment wrapper css if message has text and has attachment', async () => {
    const message = generateAliceMessage({
      attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
      text: 'Hello world',
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceInnerWrapperTestId).className).toContain(
      '--has-attachment',
    );
  });

  it('should set emoji wrapper css if message has emoji-only text', async () => {
    const message = generateAliceMessage({ text: '🚀🚀🚀' });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(messageCommerceInnerWrapperTestId).className).toContain(
      '--is-emoji',
    );
  });

  it('should trigger on message hover event handler when the user hovers a message text', async () => {
    const message = generateAliceMessage();
    const onMentionsHover = jest.fn();
    const { getByTestId } = await renderMessageCommerce(message, {
      onMentionsHover,
    });
    expect(onMentionsHover).not.toHaveBeenCalled();
    fireEvent.mouseOver(getByTestId(messageCommerceInnerWrapperTestId));
    expect(onMentionsHover).toHaveBeenCalledTimes(1);
  });

  it('should trigger on message click event handler on message click when message has text', async () => {
    const message = generateAliceMessage();
    const onMentionsClick = jest.fn();
    const { getByTestId } = await renderMessageCommerce(message, {
      onMentionsClick,
    });
    expect(onMentionsClick).not.toHaveBeenCalled();
    fireEvent.click(getByTestId(messageCommerceInnerWrapperTestId));
    expect(onMentionsClick).toHaveBeenCalledTimes(1);
  });

  it('should inform that the message was not sent when message has text and is of type "error"', async () => {
    const message = generateAliceMessage({ type: 'error', text: 'Hello!' });
    const { getByText } = await renderMessageCommerce(message);
    expect(getByText('Error · Unsent')).toBeInTheDocument();
  });

  it('should render the message html when unsafeHTML property is true', async () => {
    const customTestId = 'custom-html';
    const message = generateAliceMessage({
      html: `<span data-testid="${customTestId}" />`,
    });
    const { getByTestId } = await renderMessageCommerce(message, {
      unsafeHTML: true,
    });

    expect(getByTestId(customTestId)).toBeInTheDocument();
  });

  it('should render the message text when it has one', async () => {
    const text = 'Hello, world!';
    const message = generateAliceMessage({ text });
    const { getByText } = await renderMessageCommerce(message);
    expect(getByText(text)).toBeInTheDocument();
  });

  it('should display the reaction list when message has text and reactions and detailed reactions are not displayed', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
      text: 'hello world',
    });
    const { getByTestId } = await renderMessageCommerce(message);
    expect(getByTestId(reactionListTestId)).toBeInTheDocument();
  });

  it('should display detailed reactions when message has text, reactions and user clicks on the reaction list', async () => {
    const bobReaction = generateReaction({ user: bob });
    const message = generateAliceMessage({
      latest_reactions: [bobReaction],
    });
    const { getByTestId, queryByTestId } = await renderMessageCommerce(message);
    expect(queryByTestId(reactionSelectorTestId)).toBeNull();
    fireEvent.click(getByTestId(reactionListTestId));
    expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();
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
    const openThread = jest.fn();
    const { getByTestId } = await renderMessageCommerce(message, {
      openThread,
    });
    expect(openThread).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('replies-count-button'));
    expect(openThread).toHaveBeenCalledWith(
      message,
      expect.any(Object), // The Event object
    );
  });

  it('should display user name when message is not from current user', async () => {
    const message = generateBobMessage();
    const { getByText } = await renderMessageCommerce(message);
    expect(getByText(bob.name)).toBeInTheDocument();
  });

  it("should display message's timestamp with time only format", async () => {
    const messageDate = new Date('2019-12-25T01:00:00');
    const parsedDateText = '01:00:00';
    const message = generateAliceMessage({
      created_at: messageDate,
    });
    const format = jest.fn(() => parsedDateText);
    const customTDateTimeParser = jest.fn(() => ({
      format,
    }));
    const { getByText } = await renderMessageCommerce(message, {
      tDateTimeParser: customTDateTimeParser,
    });
    expect(customTDateTimeParser).toHaveBeenCalledWith(messageDate);
    expect(format).toHaveBeenCalledWith('LT');
    expect(getByText(parsedDateText)).toBeInTheDocument();
  });
});
